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

async function login(prefix = 'home'): Promise<string> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.60.${Math.floor(Math.random() * 200)}.1`;
  await app.request('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email }),
  });
  const code = await getOtpCode(email);
  const res = await app.request('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email, code }),
  });
  return ((await res.json()) as { token: string }).token;
}

async function createTribe(token: string, overrides: Record<string, unknown> = {}) {
  const tag = `trb-${unique()}`;
  return app.request('/api/tribes', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: `Danse du Sud ${unique()}`,
      tag,
      topic: 'danse',
      description: 'Partageons nos pas de danse ancestraux.',
      rules: [
        { title: 'Respect', description: 'Pas d’insultes' },
        { title: 'Authenticité', description: 'Partagez des contenus vérifiés' },
      ],
      ...overrides,
    }),
  });
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

const auth = (token: string) => ({ 'content-type': 'application/json', Authorization: `Bearer ${token}` });

async function postIn(token: string, tribeId: string | undefined, title: string): Promise<string> {
  const res = await app.request('/api/posts', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({ type: 'Text', title, body: 'Contenu de test', ...(tribeId ? { tribeId } : {}) }),
  });
  expect(res.status).toBe(201);
  return ((await res.json()) as { id: string }).id;
}

async function feed(token: string, filter: string) {
  const res = await app.request(`/api/feed?filter=${filter}`, { headers: auth(token) });
  expect(res.status).toBe(200);
  return (await res.json()) as { posts: Array<{ id: string; tribe: { id: string } | null }>; total: number };
}

describe('GET /api/feed?filter=tribes — accueil des tribus rejointes', () => {
  it('ne montre que les posts des tribus rejointes (et pas ceux des autres tribus ni hors tribu)', async () => {
    const author = await login();
    const reader = await login();
    const joinedTribe = ((await (await createTribe(author)).json()) as { id: string }).id;
    const otherTribe = ((await (await createTribe(author)).json()) as { id: string }).id;

    const inJoined = await postIn(author, joinedTribe, 'Post dans la tribu rejointe');
    const inOther = await postIn(author, otherTribe, 'Post dans une autre tribu');
    const noTribe = await postIn(author, undefined, 'Post hors tribu');

    expect((await app.request(`/api/tribes/${joinedTribe}/join`, { method: 'POST', headers: auth(reader) })).status).toBe(200);

    const ids = (await feed(reader, 'tribes')).posts.map((p) => p.id);
    expect(ids).toContain(inJoined);
    expect(ids).not.toContain(inOther);
    expect(ids).not.toContain(noTribe);
  });

  it('un compte sans tribu reçoit le repli « for-you » (jamais un fil vide)', async () => {
    const author = await login();
    const newcomer = await login();
    const tribe = ((await (await createTribe(author)).json()) as { id: string }).id;
    const postId = await postIn(author, tribe, 'Visible par un nouveau compte');

    const ids = (await feed(newcomer, 'tribes')).posts.map((p) => p.id);
    expect(ids).toContain(postId);
  });

  it('exclut les posts des auteurs bloqués', async () => {
    const author = await login();
    const reader = await login();
    const tribe = ((await (await createTribe(author)).json()) as { id: string }).id;
    const other = await login();
    await app.request(`/api/tribes/${tribe}/join`, { method: 'POST', headers: auth(reader) });
    const blockedPost = await postIn(author, tribe, 'Post d’un auteur bloqué');
    await app.request(`/api/tribes/${tribe}/join`, { method: 'POST', headers: auth(other) });
    const okPost = await postIn(other, tribe, 'Post d’un auteur non bloqué');

    const me = (await (await app.request('/api/users/me', { headers: auth(author) })).json()) as { id: string };
    const blockRes = await app.request(`/api/safety/users/${me.id}/block`, { method: 'POST', headers: auth(reader) });
    expect([200, 201, 204]).toContain(blockRes.status);

    const ids = (await feed(reader, 'tribes')).posts.map((p) => p.id);
    expect(ids).not.toContain(blockedPost);
    expect(ids).toContain(okPost);
  });

  it('refuse un filtre inconnu (400)', async () => {
    const token = await login();
    const res = await app.request('/api/feed?filter=nimportequoi', { headers: auth(token) });
    expect(res.status).toBe(400);
  });
});
