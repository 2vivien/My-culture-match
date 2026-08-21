import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app';
import { redis } from '../../src/infrastructure/redis';
import { closeFeedFanoutQueue } from '../../src/modules/feed/feed.queue';
import { closeSearchQueue } from '../../src/modules/search/search.queue';
import { closeEmbeddingQueue } from '../../src/modules/culture-engine/embedding.queue';
import { closeCountersFlushQueue } from '../../src/modules/feed/counters.queue';

const app = createApp();

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function getOtpCode(email: string): Promise<string> {
  const raw = await redis.get(`otp:${email}`);
  if (!raw) throw new Error(`OTP introuvable pour ${email}`);
  return (JSON.parse(raw) as { code: string }).code;
}

async function onboardUser(prefix: string): Promise<{ token: string; userId: string }> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.31.${Math.floor(Math.random() * 200)}.1`;
  await app.request('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email }),
  });
  const code = await getOtpCode(email);
  const verify = await app.request('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email, code }),
  });
  const { token } = (await verify.json()) as { token: string };

  await app.request('/api/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      email,
      name: 'Awa',
      username: `awa${unique()}`,
      avatarSeed: 'seed',
      gender: 'female',
      seeking: 'friendship',
      birthdate: '1995-06-15',
      roots: { country: 'Bénin', region: 'Atlantique', ethnicity: 'Fon', village: 'Abomey' },
      languages: ['fr', 'fon'],
      intention: 'dating',
      acceptedTermsAt: new Date().toISOString(),
    }),
  });

  const me = await app.request('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
  const body = (await me.json()) as { id: string };
  return { token, userId: body.id };
}

const authed = (token: string, method = 'GET') => ({
  method,
  headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
});
const authedJson = (token: string, body: unknown, method = 'POST') => ({
  method,
  headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(body),
});

beforeAll(async () => {
  await redis.flushall();
});

afterAll(async () => {
  await redis.flushall();
  await closeFeedFanoutQueue();
  await closeSearchQueue();
  await closeEmbeddingQueue();
  await closeCountersFlushQueue();
  await redis.quit();
});

describe('MP11 — Notifications', () => {
  it('une demande de connexion crée une notification pour le destinataire', async () => {
    const a = await onboardUser('notif');
    const b = await onboardUser('notif');

    await app.request(`/api/connections/${b.userId}/request`, authed(a.token, 'POST'));

    const res = await app.request('/api/notifications', authed(b.token));
    expect(res.status).toBe(200);
    const notifications = (await res.json()) as { id: string; type: string; user: { id: string } }[];
    const mine = notifications.find((n) => n.type === 'request' && n.user.id === a.userId);
    expect(mine).toBeDefined();

    const unread = await app.request('/api/notifications/unread-count', authed(b.token));
    expect(((await unread.json()) as { unreadCount: number }).unreadCount).toBeGreaterThan(0);
  });

  it('accepter via la notification → devient compagnon', async () => {
    const a = await onboardUser('notif');
    const b = await onboardUser('notif');

    await app.request(`/api/connections/${b.userId}/request`, authed(a.token, 'POST'));

    const res = await app.request('/api/notifications', authed(b.token));
    const notifications = (await res.json()) as { id: string; type: string; user: { id: string } }[];
    const request = notifications.find((n) => n.type === 'request' && n.user.id === a.userId);
    expect(request).toBeDefined();

    const accept = await app.request(`/api/notifications/${request!.id}/accept`, authed(b.token, 'POST'));
    expect(accept.status).toBe(200);

    const companions = await app.request('/api/connections/companions', authed(a.token));
    const { connections } = (await companions.json()) as { connections: { profile: { id: string } }[] };
    expect(connections.some((x) => x.profile.id === b.userId)).toBe(true);
  });

  it('PATCH isUnread + read-all décrémentent le badge', async () => {
    const a = await onboardUser('notif');
    const b = await onboardUser('notif');

    await app.request(`/api/connections/${b.userId}/request`, authed(a.token, 'POST'));

    const res = await app.request('/api/notifications', authed(b.token));
    const notifications = (await res.json()) as { id: string }[];
    const id = notifications[0]!.id;

    const patch = await app.request(`/api/notifications/${id}`, authedJson(b.token, { isUnread: false }, 'PATCH'));
    expect(patch.status).toBe(200);

    const after = await app.request('/api/notifications/unread-count', authed(b.token));
    expect(((await after.json()) as { unreadCount: number }).unreadCount).toBe(0);
  });

  it('read-all marque tout lu', async () => {
    const a = await onboardUser('notif');
    const b = await onboardUser('notif');

    await app.request(`/api/connections/${b.userId}/request`, authed(a.token, 'POST'));

    const res = await app.request('/api/notifications/read-all', authed(b.token, 'POST'));
    expect(res.status).toBe(200);

    const after = await app.request('/api/notifications/unread-count', authed(b.token));
    expect(((await after.json()) as { unreadCount: number }).unreadCount).toBe(0);
  });

  it('un like sur un post crée une notification groupée (déduplication 1h)', async () => {
    const a = await onboardUser('notif');
    const b = await onboardUser('notif');

    const create = await app.request('/api/posts', authedJson(b.token, { type: 'Text', title: 'Yamato day', body: 'une belle tradition japonaise' }));
    const post = (await create.json()) as { id: string };

    await app.request(`/api/posts/${post.id}/like`, authed(a.token, 'POST'));
    await app.request(`/api/posts/${post.id}/like`, authed(a.token, 'POST'));

    const res = await app.request('/api/notifications', authed(b.token));
    const notifications = (await res.json()) as { id: string; type: string; user: { id: string } }[];
    const likes = notifications.filter((n) => n.type === 'like' && n.user.id === a.userId);
    expect(likes.length).toBe(1);
  });
});
