import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app';
import { redis } from '../../src/infrastructure/redis';
import { closeFeedFanoutQueue } from '../../src/modules/feed/feed.queue';
import { closeSearchQueue } from '../../src/modules/search/search.queue';
import { closeEmbeddingQueue } from '../../src/modules/culture-engine/embedding.queue';
import { closeCountersFlushQueue } from '../../src/modules/feed/counters.queue';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../../src/infrastructure/database';
import { closeAccountCleanupQueue } from '../../src/modules/users/account-cleanup.queue';

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


const del = (token: string) => app.request('/api/users/me', { ...authed(token, 'DELETE'), body: JSON.stringify({ confirm: 'SUPPRIMER MON COMPTE' }) });

async function makeTribe(ownerId: string, visibility: 'private' | 'public', members: Array<{ userId: string; role: 'member' | 'moderator'; joinedAt: Date }>) {
  const [tribe] = await db.insert(schema.tribes).values({ name: `Tribu ${unique()}`, tag: `t${unique()}`, topic: 'danse', createdById: ownerId, visibility, memberCount: members.length + 1 }).returning();
  await db.insert(schema.tribeMembers).values([{ tribeId: tribe!.id, userId: ownerId, role: 'owner' as const }, ...members.map((m) => ({ tribeId: tribe!.id, ...m }))]);
  return tribe!.id;
}
async function makePost(authorId: string, tribeId: string) {
  const [p] = await db.insert(schema.posts).values({ authorId, tribeId, title: 'Secret de tribu', body: 'Contenu privé' }).returning();
  return p!.id;
}

beforeAll(async () => { await redis.flushall(); });
afterAll(async () => {
  await redis.flushall();
  await closeFeedFanoutQueue();
  await closeSearchQueue();
  await closeEmbeddingQueue();
  await closeCountersFlushQueue();
  await closeAccountCleanupQueue();
  await redis.quit();
});

describe('Suppression du compte du créateur d’une tribu', () => {
  it('tribu privée : la propriété passe au plus ancien modérateur et les posts des membres restent privés', async () => {
    const owner = await onboardUser('own');
    const mod = await onboardUser('mod');
    const member = await onboardUser('mem');
    const outsider = await onboardUser('out');
    const tribeId = await makeTribe(owner.userId, 'private', [
      { userId: member.userId, role: 'member', joinedAt: new Date('2024-01-01') },
      { userId: mod.userId, role: 'moderator', joinedAt: new Date('2024-06-01') },
    ]);
    const postId = await makePost(member.userId, tribeId);

    expect((await del(owner.token)).status).toBe(200);

    const [tribe] = await db.select().from(schema.tribes).where(eq(schema.tribes.id, tribeId));
    expect(tribe?.createdById).toBe(mod.userId);
    const [role] = await db.select().from(schema.tribeMembers).where(and(eq(schema.tribeMembers.tribeId, tribeId), eq(schema.tribeMembers.userId, mod.userId)));
    expect(role?.role).toBe('owner');
    const [post] = await db.select().from(schema.posts).where(eq(schema.posts.id, postId));
    expect(post?.tribeId).toBe(tribeId);
    expect((await app.request(`/api/posts/${postId}`, authed(outsider.token))).status).toBe(404);
  });

  it('tribu privée sans autre membre ni successeur : les posts sont marqués supprimés, jamais publics', async () => {
    const owner = await onboardUser('own');
    const tribeId = await makeTribe(owner.userId, 'private', []);
    const postId = await makePost(owner.userId, tribeId);
    // Un post d’un ancien membre resté en base (cas limite) ne doit pas fuiter non plus.
    const stranger = await onboardUser('str');
    const strangerPost = await makePost(stranger.userId, tribeId);

    expect((await del(owner.token)).status).toBe(200);

    const [own] = await db.select().from(schema.posts).where(eq(schema.posts.id, postId));
    expect(own).toBeUndefined(); // supprimé avec son auteur
    const [other] = await db.select().from(schema.posts).where(eq(schema.posts.id, strangerPost));
    expect(other?.status).toBe('deleted');
    expect(other?.deletedAt).not.toBeNull();
  });
});
