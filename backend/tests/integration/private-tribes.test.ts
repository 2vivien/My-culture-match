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

async function login(prefix = 'prv'): Promise<string> {
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

async function privateTribe(owner: string): Promise<string> {
  const res = await createTribe(owner, { visibility: 'private' });
  expect(res.status).toBe(201);
  return (await json<{ id: string }>(res)).id;
}

async function postIn(token: string, tribeId: string, title: string): Promise<string> {
  const res = await app.request('/api/posts', { method: 'POST', headers: auth(token), body: JSON.stringify({ type: 'Text', title, body: 'Contenu privé', tribeId }) });
  expect(res.status).toBe(201);
  return (await json<{ id: string }>(res)).id;
}

const meId = async (token: string) => (await json<{ id: string }>(await app.request('/api/users/me', { headers: auth(token) }))).id;

describe('tribus privées', () => {
  it('rejoindre une tribu privée dépose une demande et ne donne pas accès', async () => {
    const owner = await login();
    const visitor = await login();
    const id = await privateTribe(owner);

    const res = await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: auth(visitor) });
    expect(res.status).toBe(200);
    expect(await json<{ joined: boolean; requested: boolean }>(res)).toMatchObject({ joined: false, requested: true });

    const detail = await json<{ visibility: string; joined: boolean; requestPending: boolean }>(await app.request(`/api/tribes/${id}`, { headers: auth(visitor) }));
    expect(detail).toMatchObject({ visibility: 'private', joined: false, requestPending: true });

    expect((await app.request(`/api/tribes/${id}/posts`, { headers: auth(visitor) })).status).toBe(403);
  });

  it('un non-membre ne voit le post ni par id, ni commentaires, ni recherche, ni fil', async () => {
    const owner = await login();
    const outsider = await login();
    const id = await privateTribe(owner);
    const title = `Secret-${unique()}`;
    const postId = await postIn(owner, id, title);

    expect((await app.request(`/api/posts/${postId}`, { headers: auth(outsider) })).status).toBe(404);
    expect((await app.request(`/api/posts/${postId}/comments`, { headers: auth(outsider) })).status).toBe(404);
    expect((await app.request(`/api/posts/${postId}/like`, { method: 'POST', headers: auth(outsider) })).status).toBe(404);

    const search = await json<{ posts: Array<{ id: string }> }>(await app.request(`/api/search?q=${title}&type=posts`, { headers: auth(outsider) }));
    expect(search.posts.map((p) => p.id)).not.toContain(postId);

    const feed = await json<{ posts: Array<{ id: string }> }>(await app.request('/api/feed?filter=for-you', { headers: auth(outsider) }));
    expect(feed.posts.map((p) => p.id)).not.toContain(postId);

    expect((await app.request(`/api/posts/${postId}`, { headers: auth(owner) })).status).toBe(200);
  });

  it('une tribu privée n’est pas listée pour un non-membre', async () => {
    const owner = await login();
    const outsider = await login();
    const id = await privateTribe(owner);

    const asOutsider = await json<{ tribes: Array<{ id: string }> }>(await app.request('/api/tribes?limit=50', { headers: auth(outsider) }));
    expect(asOutsider.tribes.map((t) => t.id)).not.toContain(id);
    const asOwner = await json<{ tribes: Array<{ id: string }> }>(await app.request('/api/tribes?limit=50', { headers: auth(owner) }));
    expect(asOwner.tribes.map((t) => t.id)).toContain(id);
  });

  it('un modérateur approuve la demande : le demandeur devient membre et accède au contenu', async () => {
    const owner = await login();
    const visitor = await login();
    const id = await privateTribe(owner);
    const postId = await postIn(owner, id, 'Bienvenue');
    await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: auth(visitor) });
    const visitorId = await meId(visitor);

    const pending = await json<{ requests: Array<{ userId: string }> }>(await app.request(`/api/tribes/${id}/join-requests`, { headers: auth(owner) }));
    expect(pending.requests.map((r) => r.userId)).toContain(visitorId);

    expect((await app.request(`/api/tribes/${id}/join-requests/${visitorId}/approve`, { method: 'POST', headers: auth(visitor) })).status).toBe(403);
    expect((await app.request(`/api/tribes/${id}/join-requests/${visitorId}/approve`, { method: 'POST', headers: auth(owner) })).status).toBe(200);

    expect((await app.request(`/api/tribes/${id}/posts`, { headers: auth(visitor) })).status).toBe(200);
    expect((await app.request(`/api/posts/${postId}`, { headers: auth(visitor) })).status).toBe(200);
  });

  it('un refus supprime la demande sans donner accès, et la demande est annulable', async () => {
    const owner = await login();
    const a = await login();
    const b = await login();
    const id = await privateTribe(owner);
    await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: auth(a) });
    await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: auth(b) });

    expect((await app.request(`/api/tribes/${id}/join-requests/${await meId(a)}/decline`, { method: 'POST', headers: auth(owner) })).status).toBe(200);
    expect((await app.request(`/api/tribes/${id}/posts`, { headers: auth(a) })).status).toBe(403);
    expect((await app.request(`/api/tribes/${id}/join-requests/${await meId(a)}/decline`, { method: 'POST', headers: auth(owner) })).status).toBe(404);

    const cancel = await json<{ cancelled: boolean }>(await app.request(`/api/tribes/${id}/join-request`, { method: 'DELETE', headers: auth(b) }));
    expect(cancel.cancelled).toBe(true);
  });

  it('une tribu publique reste inchangée : adhésion immédiate', async () => {
    const owner = await login();
    const visitor = await login();
    const id = (await json<{ id: string }>(await createTribe(owner))).id;
    const res = await json<{ joined: boolean }>(await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: auth(visitor) }));
    expect(res.joined).toBe(true);
  });

  it('l’Explorer ne divulgue ni la tribu privée ni ses médias à un non-membre', async () => {
    const owner = await login();
    const outsider = await login();
    const name = `Secrete ${unique()}`;
    const res = await createTribe(owner, { visibility: 'private', name });
    const id = (await json<{ id: string }>(res)).id;
    await app.request('/api/posts', { method: 'POST', headers: auth(owner), body: JSON.stringify({ type: 'Images', title: 'Image privée', mediaUrls: ['https://example.com/prive.jpg'], tribeId: id }) });

    const asOutsider = JSON.stringify(await json<unknown>(await app.request('/api/explore', { headers: auth(outsider) })));
    expect(asOutsider).not.toContain(name);
    expect(asOutsider).not.toContain('prive.jpg');
  });

  it('un post d’une tribu privée ne peut pas être reposté vers une tribu publique', async () => {
    const owner = await login();
    const member = await login();
    const id = await privateTribe(owner);
    const postId = await postIn(owner, id, 'À ne pas diffuser');
    await app.request(`/api/tribes/${id}/join`, { method: 'POST', headers: auth(member) });
    await app.request(`/api/tribes/${id}/join-requests/${await meId(member)}/approve`, { method: 'POST', headers: auth(owner) });

    const publicTribe = (await json<{ id: string }>(await createTribe(member))).id;
    const repost = await app.request('/api/posts', { method: 'POST', headers: auth(member), body: JSON.stringify({ type: 'Repost', title: 'Repost', tribeId: publicTribe, originalPostId: postId }) });
    expect(repost.status).toBe(403);
  });

  it('supprimer une tribu privée ne rend pas ses posts publics', async () => {
    const owner = await login();
    const outsider = await login();
    const id = await privateTribe(owner);
    const postId = await postIn(owner, id, 'Contenu privé');

    expect((await app.request(`/api/tribes/${id}`, { method: 'DELETE', headers: auth(owner) })).status).toBe(200);
    expect((await app.request(`/api/posts/${postId}`, { headers: auth(outsider) })).status).toBe(404);
    const feed = await json<{ posts: Array<{ id: string }> }>(await app.request('/api/feed?filter=for-you', { headers: auth(outsider) }));
    expect(feed.posts.map((p) => p.id)).not.toContain(postId);
  });
});
