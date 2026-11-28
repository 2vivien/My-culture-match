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



describe('Âge de la personne qui utilise Love', () => {
  const setBirthdate = (userId: string, birthdate: Date | null) => db.update(schema.users).set({ birthdate }).where(eq(schema.users.id, userId));
  const code = async (res: Response) => ((await res.json()) as { error?: { code?: string } }).error?.code;

  it('un mineur ne peut pas activer loveEnabled (403 LOVE_ADULT_REQUIRED)', async () => {
    const minor = await onboardUser('lage');
    await setBirthdate(minor.userId, new Date(Date.now() - 15 * 365.25 * 24 * 3600 * 1000));
    const res = await app.request('/api/consent/settings', { method: 'PATCH', headers: { 'content-type': 'application/json', Authorization: `Bearer ${minor.token}` }, body: JSON.stringify({ loveEnabled: true }) });
    expect(res.status).toBe(403);
    expect(await code(res)).toBe('LOVE_ADULT_REQUIRED');
  });

  it('un compte sans date de naissance ne peut pas activer loveEnabled', async () => {
    const user = await onboardUser('lage');
    await setBirthdate(user.userId, null);
    const res = await app.request('/api/consent/settings', { method: 'PATCH', headers: { 'content-type': 'application/json', Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ loveEnabled: true }) });
    expect(res.status).toBe(403);
  });

  it('un mineur déjà inscrit à Love est refusé sur suggestions, recherche, conversation et swipe', async () => {
    const adult = await loveUser('lage');
    const minor = await loveUser('lage');
    await setBirthdate(minor.userId, new Date(Date.now() - 16 * 365.25 * 24 * 3600 * 1000));

    for (const [path, init] of [
      ['/api/love/matches', authed(minor.token)],
      ['/api/love/search', authedJson(minor.token, { query: 'une femme sérieuse' })],
      ['/api/love/conversation', authedJson(minor.token, { messages: ['une femme sérieuse'] })],
      ['/api/love/swipe', authedJson(minor.token, { userId: adult.userId, action: 'like' })],
    ] as const) {
      const res = await app.request(path, init);
      expect(res.status, path).toBe(403);
      expect(await code(res), path).toBe('LOVE_ADULT_REQUIRED');
    }
    // Aucun like n'a été enregistré.
    const likes = await db.select().from(schema.loveMatches).where(eq(schema.loveMatches.userId, minor.userId));
    expect(likes).toHaveLength(0);
  });
});
