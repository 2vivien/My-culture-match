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

async function login(prefix = 'flr'): Promise<string> {
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
const json = async <T>(res: Response) => (await res.json()) as T;

async function newTribe(owner: string): Promise<string> {
  return (await json<{ id: string }>(await createTribe(owner))).id;
}
async function flair(token: string, tribeId: string, name: string, color?: string) {
  return app.request(`/api/tribes/${tribeId}/flairs`, { method: 'POST', headers: auth(token), body: JSON.stringify({ name, ...(color ? { color } : {}) }) });
}
async function post(token: string, tribeId: string, title: string, flairId?: string) {
  return app.request('/api/posts', { method: 'POST', headers: auth(token), body: JSON.stringify({ type: 'Text', title, body: 'Contenu', tribeId, ...(flairId ? { flairId } : {}) }) });
}

describe('flairs de tribu', () => {
  it('un modérateur crée un flair ; un simple membre ne peut pas ; le doublon est refusé', async () => {
    const owner = await login();
    const member = await login();
    const id = await newTribe(owner);
    await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: auth(member) });

    const created = await flair(owner, id, 'Question', '#336699');
    expect(created.status).toBe(201);
    expect(await json<{ name: string; color: string }>(created)).toMatchObject({ name: 'Question', color: '#336699' });
    expect((await flair(member, id, 'Débat')).status).toBe(403);
    expect((await flair(owner, id, 'question')).status).toBe(409);
    expect((await flair(owner, id, 'Ok', 'rouge')).status).toBe(400);

    const list = await json<{ flairs: Array<{ name: string }> }>(await app.request(`/api/tribes/${id}/flairs`, { headers: auth(member) }));
    expect(list.flairs.map((f) => f.name)).toEqual(['Question']);
  });

  it('un post porte son flair et la liste de la tribu se filtre par flair', async () => {
    const owner = await login();
    const id = await newTribe(owner);
    const q = (await json<{ id: string }>(await flair(owner, id, 'Question'))).id;
    await flair(owner, id, 'Débat');

    const withFlair = await json<{ id: string; flair: { id: string; name: string } | null }>(await post(owner, id, 'Avec flair', q));
    expect(withFlair.flair).toMatchObject({ id: q, name: 'Question' });
    const plain = await json<{ id: string; flair: unknown }>(await post(owner, id, 'Sans flair'));
    expect(plain.flair).toBeNull();

    const filtered = await json<{ posts: Array<{ id: string }> }>(await app.request(`/api/tribes/${id}/posts?flairId=${q}`, { headers: auth(owner) }));
    expect(filtered.posts.map((p) => p.id)).toEqual([withFlair.id]);
  });

  it('refuse un flair d’une autre tribu ou sans tribu', async () => {
    const owner = await login();
    const a = await newTribe(owner);
    const b = await newTribe(owner);
    const inB = (await json<{ id: string }>(await flair(owner, b, 'Autre'))).id;
    expect((await post(owner, a, 'Mauvais flair', inB)).status).toBe(400);
    const noTribe = await app.request('/api/posts', { method: 'POST', headers: auth(owner), body: JSON.stringify({ type: 'Text', title: 'Hors tribu', body: 'x', flairId: inB }) });
    expect(noTribe.status).toBe(400);
  });

  it('l’auteur ou un modérateur change le flair, un autre membre non ; la suppression du flair le retire des posts', async () => {
    const owner = await login();
    const author = await login();
    const other = await login();
    const id = await newTribe(owner);
    for (const t of [author, other]) await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: auth(t) });
    const f = (await json<{ id: string }>(await flair(owner, id, 'Info'))).id;
    const p = (await json<{ id: string }>(await post(author, id, 'Mon post'))).id;
    const put = (token: string, flairId: string | null) =>
      app.request(`/api/tribes/${id}/posts/${p}/flair`, { method: 'PUT', headers: auth(token), body: JSON.stringify({ flairId }) });

    expect((await put(other, f)).status).toBe(403);
    expect((await put(author, f)).status).toBe(200);
    expect((await json<{ flair: { id: string } | null }>(await app.request(`/api/posts/${p}`, { headers: auth(author) }))).flair?.id).toBe(f);

    expect((await app.request(`/api/tribes/${id}/flairs/${f}`, { method: 'DELETE', headers: auth(author) })).status).toBe(403);
    expect((await app.request(`/api/tribes/${id}/flairs/${f}`, { method: 'DELETE', headers: auth(owner) })).status).toBe(200);
    expect((await json<{ flair: unknown }>(await app.request(`/api/posts/${p}`, { headers: auth(author) }))).flair).toBeNull();
  });
});
