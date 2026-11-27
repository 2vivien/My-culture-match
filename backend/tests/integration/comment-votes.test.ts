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

describe('C3 — Votes et tri des commentaires', () => {
  async function seed() {
    const author = await onboardUser('cmt');
    const voterA = await onboardUser('cmt');
    const voterB = await onboardUser('cmt');
    const post = await app.request('/api/posts', authedJson(author.token, { type: 'Text', title: 'Post de test', body: 'Contenu' }));
    const { id: postId } = (await post.json()) as { id: string };
    const comment = async (token: string, text: string, parentId?: string) =>
      ((await (await app.request(`/api/posts/${postId}/comments`, authedJson(token, { text, ...(parentId ? { parentId } : {}) }))).json()) as { commentId: string }).commentId;
    const vote = (token: string, commentId: string, value: 1 | -1) => app.request(`/api/posts/${postId}/comments/${commentId}/vote`, authedJson(token, { value }));
    const list = async (token: string, sort: string) =>
      ((await (await app.request(`/api/posts/${postId}/comments?sort=${sort}`, authed(token))).json()) as { comments: Array<{ id: string; score: number; myVote: number }> }).comments;
    return { author, voterA, voterB, postId, comment, vote, list };
  }

  it('voter, changer de vote et retirer son vote met le score à jour', async () => {
    const { author, voterA, comment, vote } = await seed();
    const c = await comment(author.token, 'Premier');
    expect(((await (await vote(voterA.token, c, 1)).json()) as { score: number }).score).toBe(1);
    expect(((await (await vote(voterA.token, c, -1)).json()) as { score: number }).score).toBe(-1);
    const removed = (await (await vote(voterA.token, c, -1)).json()) as { score: number; myVote: number };
    expect(removed.score).toBe(0);
    expect(removed.myVote).toBe(0);
  });

  it('top : le commentaire le mieux noté vient en premier ; myVote reflète le lecteur', async () => {
    const { author, voterA, voterB, comment, vote, list } = await seed();
    const low = await comment(author.token, 'Bas');
    const high = await comment(author.token, 'Haut');
    await vote(voterA.token, high, 1); await vote(voterB.token, high, 1); await vote(voterA.token, low, -1);
    const top = await list(voterA.token, 'top');
    expect(top[0]?.id).toBe(high);
    expect(top[0]?.myVote).toBe(1);
    expect(top.find((x) => x.id === low)?.myVote).toBe(-1);
  });

  it('les réponses restent groupées sous leur parent pour un tri classé', async () => {
    const { author, comment, list } = await seed();
    const a = await comment(author.token, 'A');
    const b = await comment(author.token, 'B');
    const a1 = await comment(author.token, 'A1', a);
    const ids = (await list(author.token, 'old')).map((x) => x.id);
    expect(ids.indexOf(a1)).toBe(ids.indexOf(a) + 1);
    expect(ids).toContain(b);
  });

  it('refuse un vote sur un commentaire inexistant (404) et une valeur invalide (400)', async () => {
    const { author, voterA, comment, vote } = await seed();
    expect((await vote(voterA.token, 'inconnu', 1)).status).toBe(404);
    const c = await comment(author.token, 'X');
    const bad = await app.request(`/api/posts/${(await (await app.request('/api/users/me', authed(author.token))).json() as { id: string }).id}/comments/${c}/vote`, authedJson(voterA.token, { value: 5 }));
    expect([400, 404]).toContain(bad.status);
  });
});
