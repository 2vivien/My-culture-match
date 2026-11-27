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
  const ip = `10.30.${Math.floor(Math.random() * 200)}.1`;
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

  const payload = {
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
  };
  const res = await app.request('/api/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  expect(res.status).toBe(201);
  const me = await app.request('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
  const body = (await me.json()) as { id: string };
  return { token, userId: body.id };
}

const authed = (token: string, method = 'GET') => ({
  method,
  headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
});
const authedJson = (token: string, body: unknown) => ({ ...authed(token, 'POST'), body: JSON.stringify(body) });

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

describe('L1/L7 — Requêtes Love (acceptation requise)', () => {
  type LoveRequest = { userId: string };
  const pending = async (token: string) => {
    const res = await app.request('/api/love/requests', authed(token));
    expect(res.status).toBe(200);
    return ((await res.json()) as { requests: LoveRequest[] }).requests;
  };

  it('un like crée une requête visible uniquement chez le destinataire', async () => {
    const a = await onboardUser('lreq');
    const b = await onboardUser('lreq');
    await app.request('/api/love/swipe', authedJson(a.token, { userId: b.userId, action: 'like' }));

    expect((await pending(b.token)).some((r) => r.userId === a.userId)).toBe(true);
    expect((await pending(a.token)).some((r) => r.userId === b.userId)).toBe(false);
  });

  it('aucune conversation n’existe avant acceptation (contact refusé par défaut)', async () => {
    const a = await onboardUser('lreq');
    const b = await onboardUser('lreq');
    await app.request('/api/love/swipe', authedJson(a.token, { userId: b.userId, action: 'like' }));

    const direct = await app.request('/api/conversations', authedJson(a.token, { participantId: b.userId }));
    expect(direct.status).toBe(403);
  });

  it('accepter ouvre le match et la conversation, la requête disparaît', async () => {
    const a = await onboardUser('lreq');
    const b = await onboardUser('lreq');
    await app.request('/api/love/swipe', authedJson(a.token, { userId: b.userId, action: 'like' }));

    const accept = await app.request(`/api/love/requests/${a.userId}/accept`, authed(b.token, 'POST'));
    expect(accept.status).toBe(200);
    const result = (await accept.json()) as { matched: boolean; conversationId?: string };
    expect(result.matched).toBe(true);
    expect(result.conversationId).toBeDefined();
    expect((await pending(b.token)).some((r) => r.userId === a.userId)).toBe(false);

    const convs = (await (await app.request('/api/conversations', authed(a.token))).json()) as { id: string }[];
    expect(convs.some((c) => c.id === result.conversationId)).toBe(true);
  });

  it('refuser retire la requête sans créer de conversation', async () => {
    const a = await onboardUser('lreq');
    const b = await onboardUser('lreq');
    await app.request('/api/love/swipe', authedJson(a.token, { userId: b.userId, action: 'like' }));

    const decline = await app.request(`/api/love/requests/${a.userId}/decline`, authed(b.token, 'POST'));
    expect(decline.status).toBe(200);
    expect((await pending(b.token)).some((r) => r.userId === a.userId)).toBe(false);

    const convs = (await (await app.request('/api/conversations', authed(a.token))).json()) as { id: string }[];
    expect(convs).toHaveLength(0);
  });

  it('une requête d’un utilisateur bloqué est masquée et inacceptable', async () => {
    const a = await onboardUser('lreq');
    const b = await onboardUser('lreq');
    await app.request('/api/love/swipe', authedJson(a.token, { userId: b.userId, action: 'like' }));
    const block = await app.request(`/api/safety/users/${a.userId}/block`, authed(b.token, 'POST'));
    expect(block.status).toBe(201);

    expect((await pending(b.token)).some((r) => r.userId === a.userId)).toBe(false);
    const accept = await app.request(`/api/love/requests/${a.userId}/accept`, authed(b.token, 'POST'));
    expect(accept.status).toBe(403);
  });

  it('accepter une requête inexistante renvoie 404', async () => {
    const a = await onboardUser('lreq');
    const b = await onboardUser('lreq');
    const accept = await app.request(`/api/love/requests/${a.userId}/accept`, authed(b.token, 'POST'));
    expect(accept.status).toBe(404);
  });
});
