import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { createApp } from '../../src/app';
import { db, schema } from '../../src/infrastructure/database';
import { redis } from '../../src/infrastructure/redis';
import { closeFeedFanoutQueue } from '../../src/modules/feed/feed.queue';
import { closeSearchQueue } from '../../src/modules/search/search.queue';
import { closeEmbeddingQueue } from '../../src/modules/culture-engine/embedding.queue';
import { closeCountersFlushQueue } from '../../src/modules/feed/counters.queue';
import { closeCultureEngineQueue } from '../../src/modules/culture-engine/batch.queue';
import { addFollower, fanoutPostToFollowers } from '../../src/modules/feed/fanout';
import { computeHealthMetrics, getLastHealthMetrics } from '../../src/modules/culture-engine/health';
import { enqueueCultureEngineBatch, cultureBatchQueue } from '../../src/modules/culture-engine/batch.queue';
import { buildUserProfileVector, recomputeUserVector } from '../../src/modules/culture-engine/profile-vector';
import { compatLove } from '../../src/modules/culture-engine/scoring';

const app = createApp();

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function getOtpCode(email: string): Promise<string> {
  const raw = await redis.get(`otp:${email}`);
  if (!raw) throw new Error(`OTP introuvable pour ${email}`);
  return (JSON.parse(raw) as { code: string }).code;
}

async function onboardUser(prefix: string): Promise<{ token: string; userId: string }> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.50.${Math.floor(Math.random() * 200)}.1`;
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

  await app.request('/api/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
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

async function createPost(token: string, title: string, body = 'Un contenu culturel authentique'): Promise<string> {
  const res = await app.request(
    '/api/posts',
    authedJson(token, { type: 'Text', title, body, tags: ['post', 'culture'] }),
  );
  expect(res.status).toBe(201);
  const post = (await res.json()) as { id: string };
  return post.id;
}

beforeAll(async () => {
  await redis.flushall();
});

afterAll(async () => {
  await redis.flushall();
  await Promise.allSettled([
    closeSearchQueue(),
    closeEmbeddingQueue(),
    closeCountersFlushQueue(),
    closeFeedFanoutQueue(),
    closeCultureEngineQueue(),
  ]);
});

describe('Culture Engine (L03-L11)', () => {
  it('classe les posts suivis par résonance culturelle (feed following)', async () => {
    const author = await onboardUser('fau');
    const reader = await onboardUser('frd');
    const postId = await createPost(author.token, 'Le vodun et ses rites');

    await addFollower(author.userId, reader.userId);
    await fanoutPostToFollowers(postId, author.userId);

    const res = await app.request('/api/feed?filter=following&limit=20', authed(reader.token));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { posts: { id: string; author: { id: string } }[]; total: number };
    expect(body.posts.map((p) => p.id)).toContain(postId);
    expect(body.posts.some((p) => p.author.id === reader.userId)).toBe(false);
  });

  it('exclut les posts flaggés du feed (auto-modération)', async () => {
    const author = await onboardUser('tox');
    const reader = await onboardUser('rdr');
    const toxicId = await createPost(author.token, 'Je vais te tuer', 'Contenu menaçant');

    const [row] = await db.select({ status: schema.posts.status }).from(schema.posts).where(eq(schema.posts.id, toxicId)).limit(1);
    expect(row?.status).toBe('flagged');

    await addFollower(author.userId, reader.userId);
    await fanoutPostToFollowers(toxicId, author.userId);

    const res = await app.request('/api/feed?filter=following&limit=20', authed(reader.token));
    const body = (await res.json()) as { posts: { id: string }[] };
    expect(body.posts.map((p) => p.id)).not.toContain(toxicId);
  });

  it('propose des posts en mode « pour toi » (for-you), hors soi-même', async () => {
    const author = await onboardUser('fya');
    const reader = await onboardUser('fyr');
    const postId = await createPost(author.token, 'La kora sénégalaise');

    const res = await app.request('/api/feed?filter=for-you&limit=20', authed(reader.token));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { posts: { id: string; author: { id: string } }[]; total: number };
    expect(body.posts.map((p) => p.id)).toContain(postId);
    expect(body.posts.some((p) => p.author.id === reader.userId)).toBe(false);
  });

  it('calcule des matchScore love compris entre 0 et 100', async () => {
    await onboardUser('lva');
    const b = await onboardUser('lvb');

    const res = await app.request('/api/love/matches', authed(b.token));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; matchScore: number }[];
    expect(body.length).toBeGreaterThan(0);
    for (const candidate of body) {
      expect(candidate.matchScore).toBeGreaterThanOrEqual(0);
      expect(candidate.matchScore).toBeLessThanOrEqual(100);
    }

    const direct = compatLove(
      { id: 'x', values: ['famille', 'respect'], languages: ['fr'], country: 'Bénin', region: 'Atlantique', ethnicity: 'Fon', interests: [] },
      { id: 'y', values: ['famille', 'respect'], languages: ['fr'], country: 'Bénin', region: 'Atlantique', ethnicity: 'Fon', interests: [] },
    );
    expect(direct).toBeGreaterThanOrEqual(75);
    expect(direct).toBeLessThanOrEqual(100);
  });

  it('construit un vecteur de profil culturel normalisé', () => {
    const vector = buildUserProfileVector({
      roots: { country: 'Sénégal', ethnicity: 'Wolof' },
      values: ['famille', 'hospitalité'],
      languages: ['fr', 'wolof'],
      ethnicity: 'Wolof',
      country: 'Sénégal',
      region: 'Dakar',
    });
    expect(Object.keys(vector).length).toBeGreaterThanOrEqual(15);
    expect(vector.hofstede_power_distance).toBe(0.5);
    const norm = Math.sqrt(Object.values(vector).reduce((acc, v) => acc + v * v, 0));
    expect(norm).toBeGreaterThan(0);
    expect(norm).toBeLessThanOrEqual(3);
  });

  it('calcule et persiste les métriques de santé (L11)', async () => {
    await onboardUser('hlt');
    const metrics = await computeHealthMetrics(new Date('2025-01-15'));
    expect(metrics.L01_diversity).toBeGreaterThanOrEqual(0);
    expect(metrics.L03_toxicity_rate).toBeGreaterThanOrEqual(0);
    expect(metrics.L07_addiction_index).toBe(0);
    expect(metrics.L11_flagged_rate).toBeGreaterThanOrEqual(0);

    const persisted = await getLastHealthMetrics();
    expect(persisted.L01_diversity).toBeDefined();
  });

  it('enfile et traite le batch nightly (vecteur + métriques)', async () => {
    const user = await onboardUser('bch');
    await recomputeUserVector(user.userId);

    const [vrow] = await db.select({ vector: schema.userProfileVectors.vector }).from(schema.userProfileVectors).where(eq(schema.userProfileVectors.userId, user.userId)).limit(1);
    expect(vrow).toBeDefined();
    expect(Object.keys(vrow!.vector).length).toBeGreaterThanOrEqual(15);

    await enqueueCultureEngineBatch('2025-01-16');
    const waiting = await cultureBatchQueue.getWaitingCount();
    expect(waiting).toBeGreaterThan(0);
  });
});
