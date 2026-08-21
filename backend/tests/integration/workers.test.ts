import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Queue, Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { createApp } from '../../src/app';
import { db, schema } from '../../src/infrastructure/database';
import { redis } from '../../src/infrastructure/redis';
import { env } from '../../src/config/env';
import { closeFeedFanoutQueue } from '../../src/modules/feed/feed.queue';
import { closeSearchQueue } from '../../src/modules/search/search.queue';
import { closeEmbeddingQueue } from '../../src/modules/culture-engine/embedding.queue';
import { closeCountersFlushQueue } from '../../src/modules/feed/counters.queue';
import { closeModerationQueue, processModerationScan } from '../../src/modules/moderation/moderation.queue';
import { closeCultureEngineQueue } from '../../src/modules/culture-engine/batch.queue';
import { cleanupExpiredSessions, cleanupPresenceKeys } from '../../src/modules/workers/crons';
import { createNotification } from '../../src/modules/notifications/notifications.service';

const app = createApp();

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function getOtpCode(email: string): Promise<string> {
  const raw = await redis.get(`otp:${email}`);
  if (!raw) throw new Error(`OTP introuvable pour ${email}`);
  return (JSON.parse(raw) as { code: string }).code;
}

async function onboardUser(prefix: string): Promise<{ token: string; userId: string }> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.60.${Math.floor(Math.random() * 200)}.1`;
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

async function waitFor(predicate: () => Promise<boolean>, timeoutMs = 10_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) return;
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('Timeout en attente de la condition');
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
    closeModerationQueue(),
    closeCultureEngineQueue(),
  ]);
});

describe('Workers & crons (MP16)', () => {
  it('moderation.scan flag un post toxique et notifie l’auteur', async () => {
    const user = await onboardUser('scn');
    const [post] = await db
      .insert(schema.posts)
      .values({ authorId: user.userId, type: 'Text', title: 'Titre neutre', text: 'Je vais te tuer demain', body: 'Je vais te tuer demain' })
      .returning({ id: schema.posts.id });
    expect(post).toBeDefined();

    const result = await processModerationScan({ targetType: 'post', targetId: post!.id });
    expect(result.flag).toBe(true);
    expect(result.reason).toBe('TOXIC_LANGUAGE');

    const [row] = await db.select({ status: schema.posts.status }).from(schema.posts).where(eq(schema.posts.id, post!.id)).limit(1);
    expect(row?.status).toBe('flagged');

    const notifs = await db.select().from(schema.notifications).where(eq(schema.notifications.action, 'moderation.flagged'));
    expect(notifs.length).toBeGreaterThan(0);
  });

  it('moderation.scan flag un commentaire toxique', async () => {
    const user = await onboardUser('scc');
    const [post] = await db
      .insert(schema.posts)
      .values({ authorId: user.userId, type: 'Text', title: 'Titre', body: 'Contenu' })
      .returning({ id: schema.posts.id });
    const [comment] = await db
      .insert(schema.comments)
      .values({ postId: post!.id, userId: user.userId, text: 'tu vas crever' })
      .returning({ id: schema.comments.id });
    expect(comment).toBeDefined();

    const result = await processModerationScan({ targetType: 'comment', targetId: comment!.id });
    expect(result.flag).toBe(true);

    const [row] = await db.select({ status: schema.comments.status }).from(schema.comments).where(eq(schema.comments.id, comment!.id)).limit(1);
    expect(row?.status).toBe('flagged');
  });

  it('moderation.scan supprime une story toxique', async () => {
    const user = await onboardUser('scs');
    const [story] = await db
      .insert(schema.stories)
      .values({ userId: user.userId, type: 'image', url: 'https://cdn.example.com/s.png', caption: 'mort à tous', expiresAt: new Date(Date.now() + 60_000) })
      .returning({ id: schema.stories.id });
    expect(story).toBeDefined();

    const result = await processModerationScan({ targetType: 'story', targetId: story!.id });
    expect(result.flag).toBe(true);

    const rows = await db.select().from(schema.stories).where(eq(schema.stories.id, story!.id)).limit(1);
    expect(rows.length).toBe(0);
  });

  it('déplace les jobs échoués en dead letter queue', async () => {
    const q = new Queue('test.dlq.q', { connection: { url: env.REDIS_URL }, defaultJobOptions: { attempts: 1 } });
    const dlq = new Queue('test.dlq.dlq', { connection: { url: env.REDIS_URL } });
    const worker = new Worker(
      'test.dlq.q',
      async () => {
        throw new Error('boom');
      },
      { connection: { url: env.REDIS_URL } },
    );
    worker.on('failed', async (job, err) => {
      void err;
      if (job && job.attemptsMade >= (job.opts?.attempts ?? 1)) {
        await dlq.add('scan', job.data, { jobId: `dlq-${job.id}` });
      }
    });

    await q.add('x', { v: 1 });
    await waitFor(async () => (await dlq.count()) > 0);

    const counts = await dlq.getJobCounts();
    expect(counts.waiting ?? 0).toBeGreaterThan(0);

    await worker.close();
    await q.close();
    await dlq.close();
  });

  it('session.cleanup purge les sessions expirées', async () => {
    const user = await onboardUser('cln');
    const expired = await db
      .insert(schema.sessions)
      .values({ id: `sess-expired-${unique()}`, userId: user.userId, token: `tok-expired-${unique()}`, expiresAt: new Date(Date.now() - 3_600_000) })
      .returning({ id: schema.sessions.id });
    await db
      .insert(schema.sessions)
      .values({ id: `sess-future-${unique()}`, userId: user.userId, token: `tok-future-${unique()}`, expiresAt: new Date(Date.now() + 3_600_000) });

    const removed = await cleanupExpiredSessions();
    expect(removed).toBeGreaterThanOrEqual(1);

    const rows = await db.select().from(schema.sessions).where(eq(schema.sessions.id, expired[0]!.id)).limit(1);
    expect(rows.length).toBe(0);
  });

  it('presence.cleanup retire les clés de présence orphelines', async () => {
    const alive = `presence:${unique()}`;
    const orphan = `presence:${unique()}`;
    await redis.set(alive, '1', 'EX', 120);
    await redis.set(orphan, '1'); // sans TTL → orpheline

    const removed = await cleanupPresenceKeys();
    expect(removed).toBeGreaterThanOrEqual(1);
    expect(await redis.exists(orphan)).toBe(0);
    expect(await redis.exists(alive)).toBe(1);
  });

  it('notifications de modération créées (système)', async () => {
    const user = await onboardUser('ntf');
    const other = await onboardUser('nto');
    await createNotification({ userId: user.userId, actorId: other.userId, type: 'system', action: 'moderation.ban', metadata: { reason: 'test' } });
    const rows = await db.select().from(schema.notifications).where(eq(schema.notifications.userId, user.userId));
    expect(rows.length).toBeGreaterThan(0);
  });
});
