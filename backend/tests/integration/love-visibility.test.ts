import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app';
import { redis } from '../../src/infrastructure/redis';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../src/infrastructure/database';
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

/** Love est désactivé par défaut (consentement) : les fixtures s'y inscrivent explicitement. */
async function loveUser(prefix: string): Promise<{ token: string; userId: string }> {
  const user = await onboardUser(prefix);
  const res = await app.request('/api/consent/settings', { method: 'PATCH', headers: { 'content-type': 'application/json', Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ loveEnabled: true }) });
  expect(res.status).toBe(200);
  return user;
}




const ids = async (token: string, path: string) => ((await (await app.request(path, authed(token))).json()) as Array<{ id: string }>).map((c) => c.id);

describe('Visibilité des profils dans Love', () => {
  it('un compte banni n’apparaît ni dans les suggestions, ni dans la recherche, ni dans les matchs actifs', async () => {
    const a = await loveUser('lvis');
    const b = await loveUser('lvis');
    // Match actif d'abord (A et B), puis B est banni.
    await app.request('/api/love/swipe', authedJson(a.token, { userId: b.userId, action: 'like' }));
    await app.request(`/api/love/requests/${a.userId}/accept`, authed(b.token, 'POST'));
    expect(await ids(a.token, '/api/love/active')).toContain(b.userId);
    const c = await loveUser('lvis');
    await db.update(schema.users).set({ bannedAt: new Date() }).where(eq(schema.users.id, c.userId));
    await db.update(schema.users).set({ bannedAt: new Date() }).where(eq(schema.users.id, b.userId));
    await redis.del(`love:candidates:${a.userId}`);

    expect(await ids(a.token, '/api/love/matches')).not.toContain(c.userId);
    const search = await app.request('/api/love/search', authedJson(a.token, { query: 'une personne ouverte qui aime voyager' }));
    expect(search.status).toBe(200);
    expect(((await search.json()) as { results: Array<{ id: string }> }).results.map((r) => r.id)).not.toContain(c.userId);
    expect(await ids(a.token, '/api/love/active')).not.toContain(b.userId);
    const like = await app.request('/api/love/swipe', authedJson(a.token, { userId: c.userId, action: 'like' }));
    expect(like.status).toBe(403);
  });
});
