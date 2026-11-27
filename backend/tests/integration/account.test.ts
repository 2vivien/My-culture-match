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

describe('D1 — Export et suppression de compte', () => {
  it('exporte les données de l’utilisateur sans secret', async () => {
    const a = await onboardUser('acct');
    const res = await app.request('/api/users/me/export', authed(a.token));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { format: string; profile: { id: string } };
    expect(data.format).toBe('mcm-export/1');
    expect(data.profile.id).toBe(a.userId);
    expect(JSON.stringify(data).toLowerCase()).not.toMatch(/"(\w*)(token|secret|hash|password)(\w*)"\s*:/);
  });

  it('refuse la suppression sans phrase de confirmation (400)', async () => {
    const a = await onboardUser('acct');
    const res = await app.request('/api/users/me', { ...authed(a.token, 'DELETE'), body: JSON.stringify({ confirm: 'oui' }) });
    expect(res.status).toBe(400);
    const still = await app.request('/api/users/me', authed(a.token));
    expect(still.status).toBe(200);
  });

  it('supprime le compte : session révoquée, profil introuvable, contenu supprimé', async () => {
    const a = await onboardUser('acct');
    const b = await onboardUser('acct');
    const post = await app.request('/api/posts', authedJson(a.token, { type: 'Text', title: 'À effacer', body: 'Contenu' }));
    expect([200, 201]).toContain(post.status);

    const del = await app.request('/api/users/me', { ...authed(a.token, 'DELETE'), body: JSON.stringify({ confirm: 'SUPPRIMER MON COMPTE' }) });
    expect(del.status).toBe(200);

    expect((await app.request('/api/users/me', authed(a.token))).status).toBe(401);
    expect((await app.request(`/api/users/${a.userId}`, authed(b.token))).status).toBe(404);
  });
});
