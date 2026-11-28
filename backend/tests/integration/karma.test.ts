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

const login = async (): Promise<string> => (await onboardUser('krm')).token;

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
const meId = async (token: string) => (await json<{ id: string }>(await app.request('/api/users/me', { headers: auth(token) }))).id;

interface Karma { total: number; posts: number; comments: number }
const karmaOf = async (viewer: string, userId: string) => json<Karma>(await app.request(`/api/users/${userId}/karma`, { headers: auth(viewer) }));

async function newPost(token: string, title: string): Promise<string> {
  const res = await app.request('/api/posts', { method: 'POST', headers: auth(token), body: JSON.stringify({ type: 'Text', title, body: 'Contenu de test' }) });
  expect(res.status).toBe(201);
  return (await json<{ id: string }>(res)).id;
}
const votePost = (token: string, postId: string, value: 1 | -1) =>
  app.request(`/api/tribu/posts/${postId}/upvote`, { method: 'POST', headers: auth(token), body: JSON.stringify({ value }) });

async function newComment(token: string, postId: string): Promise<string> {
  const res = await app.request(`/api/posts/${postId}/comments`, { method: 'POST', headers: auth(token), body: JSON.stringify({ text: 'Un commentaire' }) });
  expect(res.status).toBe(201);
  return (await json<{ commentId: string }>(res)).commentId;
}
const voteComment = (token: string, postId: string, commentId: string, value: 1 | -1) =>
  app.request(`/api/posts/${postId}/comments/${commentId}/vote`, { method: 'POST', headers: auth(token), body: JSON.stringify({ value }) });

describe('karma — votes nets reçus', () => {
  it('un nouveau compte a un karma nul', async () => {
    const t = await login();
    expect(await karmaOf(t, await meId(t))).toEqual({ total: 0, posts: 0, comments: 0 });
  });

  it('additionne les votes reçus sur les posts et les commentaires', async () => {
    const author = await login();
    const a = await login();
    const b = await login();
    const postId = await newPost(author, 'Un post à voter');
    expect((await votePost(a, postId, 1)).status).toBe(200);
    expect((await votePost(b, postId, 1)).status).toBe(200);

    const commentId = await newComment(author, postId);
    expect((await voteComment(a, postId, commentId, 1)).status).toBe(200);
    expect((await voteComment(b, postId, commentId, -1)).status).toBe(200);

    expect(await karmaOf(a, await meId(author))).toEqual({ total: 2, posts: 2, comments: 0 });
  });

  it('les votes de l’auteur sur son propre contenu ne comptent pas', async () => {
    const author = await login();
    const other = await login();
    const postId = await newPost(author, 'Auto-vote');
    await votePost(author, postId, 1);
    const commentId = await newComment(author, postId);
    await voteComment(author, postId, commentId, 1);
    expect(await karmaOf(other, await meId(author))).toEqual({ total: 0, posts: 0, comments: 0 });
  });

  it('un vote retiré ou inversé met le karma à jour', async () => {
    const author = await login();
    const voter = await login();
    const postId = await newPost(author, 'Vote changeant');
    await votePost(voter, postId, 1);
    expect((await karmaOf(voter, await meId(author))).total).toBe(1);
    await votePost(voter, postId, -1);
    expect((await karmaOf(voter, await meId(author))).total).toBe(-1);
    await votePost(voter, postId, -1); // même valeur = retrait
    expect((await karmaOf(voter, await meId(author))).total).toBe(0);
  });

  it('un post supprimé ne compte plus', async () => {
    const author = await login();
    const voter = await login();
    const postId = await newPost(author, 'À supprimer');
    await votePost(voter, postId, 1);
    expect((await app.request(`/api/posts/${postId}`, { method: 'DELETE', headers: auth(author) })).status).toBeLessThan(300);
    expect((await karmaOf(voter, await meId(author))).posts).toBe(0);
  });

  it('/users/me/karma renvoie le karma du compte connecté ; un compte inconnu renvoie 404', async () => {
    const author = await login();
    const voter = await login();
    await votePost(voter, await newPost(author, 'Pour /me'), 1);
    expect((await json<Karma>(await app.request('/api/users/me/karma', { headers: auth(author) }))).total).toBe(1);
    expect((await app.request('/api/users/inconnu-0000/karma', { headers: auth(author) })).status).toBeGreaterThanOrEqual(403);
  });
});
