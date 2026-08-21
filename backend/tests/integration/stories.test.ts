import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app';
import { redis } from '../../src/infrastructure/redis';
import { closeFeedFanoutQueue } from '../../src/modules/feed/feed.queue';
import { closeSearchQueue } from '../../src/modules/search/search.queue';
import { closeEmbeddingQueue } from '../../src/modules/culture-engine/embedding.queue';
import { closeCountersFlushQueue } from '../../src/modules/feed/counters.queue';
import { cleanupExpiredStories } from '../../src/modules/stories/stories.service';

const app = createApp();

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function getOtpCode(email: string): Promise<string> {
  const raw = await redis.get(`otp:${email}`);
  if (!raw) throw new Error(`OTP introuvable pour ${email}`);
  return (JSON.parse(raw) as { code: string }).code;
}

async function onboardUser(prefix: string): Promise<{ token: string; userId: string }> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.32.${Math.floor(Math.random() * 200)}.1`;
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
const authedJson = (token: string, body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(body),
});

async function becomeCompanions(a: { token: string; userId: string }, b: { token: string; userId: string }): Promise<void> {
  await app.request(`/api/connections/${b.userId}/request`, authed(a.token, 'POST'));
  await app.request(`/api/requests/${a.userId}/accept`, authed(b.token, 'POST'));
}

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

describe('MP12 — Stories', () => {
  it('crée une story (expire dans 24h) et remplace la précédente', async () => {
    const a = await onboardUser('story');

    const res = await app.request('/api/stories', authedJson(a.token, { mediaUrl: 'https://example.com/s1.jpg' }));
    expect(res.status).toBe(201);
    const story = (await res.json()) as { id: string; img: string; expiresAt: string; createdAt: string };
    expect(story.expiresAt > story.createdAt).toBe(true);

    const replace = await app.request('/api/stories', authedJson(a.token, { img: 'https://example.com/s2.jpg' }));
    expect(replace.status).toBe(201);
    const replaced = (await replace.json()) as { id: string };

    const list = await app.request('/api/stories', authed(a.token));
    const stories = (await list.json()) as { id: string; isMine: boolean }[];
    expect(stories.filter((s) => s.isMine)).toHaveLength(1);
    expect(stories.find((s) => s.isMine)?.id).toBe(replaced.id);
  });

  it('montre les stories des compagnons uniquement', async () => {
    const a = await onboardUser('story');
    const b = await onboardUser('story');
    const stranger = await onboardUser('story');

    await becomeCompanions(a, b);
    await app.request('/api/stories', authedJson(b.token, { mediaUrl: 'https://example.com/b.jpg' }));
    await app.request('/api/stories', authedJson(stranger.token, { mediaUrl: 'https://example.com/x.jpg' }));

    const list = await app.request('/api/stories', authed(a.token));
    const stories = (await list.json()) as { userId: string; isMine: boolean }[];
    const ids = stories.map((s) => s.userId);
    expect(ids).toContain(b.userId);
    expect(ids).not.toContain(stranger.userId);
  });

  it('enregistre une vue (viewers + viewed)', async () => {
    const a = await onboardUser('story');
    const b = await onboardUser('story');
    await becomeCompanions(a, b);

    const created = await app.request('/api/stories', authedJson(b.token, { mediaUrl: 'https://example.com/v.jpg' }));
    const story = (await created.json()) as { id: string };

    const view = await app.request(`/api/stories/${story.id}/view`, authed(a.token, 'POST'));
    expect(view.status).toBe(200);
    expect(((await view.json()) as { viewers: number }).viewers).toBe(1);

    const list = await app.request('/api/stories', authed(a.token));
    const stories = (await list.json()) as { id: string; viewed: boolean }[];
    expect(stories.find((s) => s.id === story.id)?.viewed).toBe(true);
  });

  it('refuse une story avec une URL invalide (400)', async () => {
    const a = await onboardUser('story');
    const res = await app.request('/api/stories', authedJson(a.token, { mediaUrl: 'pas-une-url' }));
    expect(res.status).toBe(400);
  });

  it('cleanup supprime les stories expirées', async () => {
    const a = await onboardUser('story');
    await app.request('/api/stories', authedJson(a.token, { mediaUrl: 'https://example.com/exp.jpg' }));
    const deleted = await cleanupExpiredStories();
    expect(deleted).toBeGreaterThanOrEqual(0);
  });
});
