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

async function onboardUser(prefix: string, name = 'Awa'): Promise<{ token: string; userId: string }> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.33.${Math.floor(Math.random() * 200)}.1`;
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

  const username = `${name.toLowerCase().replace(/\s/g, '')}${unique()}`;
  await app.request('/api/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      email,
      name,
      username,
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

describe('MP13 — Recherche globale', () => {
  it('retrouve un post publié par son titre', async () => {
    const a = await onboardUser('search');
    const b = await onboardUser('search');

    const created = await app.request('/api/posts', authedJson(b.token, { type: 'Text', title: 'Yamato Imperial Festival', body: 'grand festival au Japon' }));
    expect(created.status).toBe(201);
    const post = (await created.json()) as { id: string };

    const res = await app.request('/api/search?q=yamato&type=posts', authed(a.token));
    expect(res.status).toBe(200);
    const { posts } = (await res.json()) as { posts: { id: string; title: string }[] };
    expect(posts.some((p) => p.id === post.id)).toBe(true);
  });

  it('retrouve un utilisateur par son nom/username (hors soi-même et bloqués)', async () => {
    const searcher = await onboardUser('search', 'Autre');
    const yamato = await onboardUser('search', 'Yamato');

    const res = await app.request('/api/search?q=yamato&type=users', authed(searcher.token));
    const { users } = (await res.json()) as { users: { id: string; name: string }[] };
    expect(users.some((u) => u.id === yamato.userId && u.name === 'Yamato')).toBe(true);
  });

  it('retrouve une tribu par son nom', async () => {
    const a = await onboardUser('search');
    const tribeTag = `sakura${unique()}`;
    const tribeName = `Sakura Clan ${tribeTag}`;

    const created = await app.request(
      '/api/tribes',
      authedJson(a.token, { name: tribeName, tag: tribeTag, description: 'Culture japonaise', topic: 'posts' }),
    );
    expect(created.status).toBe(201);

    const res = await app.request(`/api/search?q=${tribeTag}&type=tribes`, authed(a.token));
    const { tribes } = (await res.json()) as { tribes: { name: string }[] };
    expect(tribes.some((t) => t.name === tribeName)).toBe(true);
  });

  it('rejette une requête de moins de 2 caractères (400)', async () => {
    const a = await onboardUser('search');
    const res = await app.request('/api/search?q=a', authed(a.token));
    expect(res.status).toBe(400);
  });

  it('rate limit 30/min → 429', async () => {
    const a = await onboardUser('search');
    await redis.set(`rl:search:${a.userId}`, '30');

    const res = await app.request('/api/search?q=yamato', authed(a.token));
    expect(res.status).toBe(429);
  });
});
