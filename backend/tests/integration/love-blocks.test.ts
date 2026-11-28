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

/** Love est désactivé par défaut (consentement) : les fixtures s'y inscrivent explicitement. */
async function loveUser(prefix: string): Promise<{ token: string; userId: string }> {
  const user = await onboardUser(prefix);
  const res = await app.request('/api/consent/settings', { method: 'PATCH', headers: { 'content-type': 'application/json', Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ loveEnabled: true }) });
  expect(res.status).toBe(200);
  return user;
}


describe('Blocage à sens unique dans Love', () => {
  const ids = async (token: string, path: string) => ((await (await app.request(path, authed(token))).json()) as Array<{ id: string }>).map((c) => c.id);

  it('si B bloque A, A ne voit plus B dans ses suggestions (cache de 1 h compris) et inversement', async () => {
    const a = await loveUser('lblk');
    const b = await loveUser('lblk');
    // Remplit le cache de suggestions des deux côtés : chacun voit l'autre.
    expect(await ids(a.token, '/api/love/matches')).toContain(b.userId);
    expect(await ids(b.token, '/api/love/matches')).toContain(a.userId);

    const block = await app.request(`/api/safety/users/${a.userId}/block`, authed(b.token, 'POST'));
    expect(block.status).toBe(201);

    expect(await ids(a.token, '/api/love/matches')).not.toContain(b.userId);
    expect(await ids(b.token, '/api/love/matches')).not.toContain(a.userId);
  });

  it('un match actif avec une personne qui a bloqué disparaît de /love/active', async () => {
    const a = await loveUser('lblk');
    const b = await loveUser('lblk');
    await app.request('/api/love/swipe', authedJson(a.token, { userId: b.userId, action: 'like' }));
    const accept = await app.request(`/api/love/requests/${a.userId}/accept`, authed(b.token, 'POST'));
    expect(((await accept.json()) as { matched: boolean }).matched).toBe(true);
    expect(await ids(a.token, '/api/love/active')).toContain(b.userId);

    await app.request(`/api/safety/users/${a.userId}/block`, authed(b.token, 'POST'));
    expect(await ids(a.token, '/api/love/active')).not.toContain(b.userId);
  });

  it('A ne peut plus liker B après un blocage de B', async () => {
    const a = await loveUser('lblk');
    const b = await loveUser('lblk');
    await app.request(`/api/safety/users/${a.userId}/block`, authed(b.token, 'POST'));
    const res = await app.request('/api/love/swipe', authedJson(a.token, { userId: b.userId, action: 'like' }));
    expect(res.status).toBe(403);
  });
});
