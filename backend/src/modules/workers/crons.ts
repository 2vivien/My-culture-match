import { Queue, Worker } from 'bullmq';
import { eq, lt } from 'drizzle-orm';
import { env } from '../../config/env';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { logger } from '../../middleware/logger';
import { getSuggestions } from '../connections/connections.service';
import { revealDueTemporalMessages } from '../temporal-messages/temporal-messages.service';

// ── presence.cleanup (toutes les 5 min) ────────────────────
export const PRESENCE_CLEANUP_QUEUE_NAME = 'presence.cleanup';
const presenceCleanupQueue = new Queue(PRESENCE_CLEANUP_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: { removeOnComplete: 100, removeOnFail: 100 },
});

/** Supprime les clés de présence orphelines (sans TTL) — filet de sécurité. */
export async function cleanupPresenceKeys(): Promise<number> {
  let cursor = '0';
  let removed = 0;
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', 'presence:*', 'COUNT', 100);
    cursor = next;
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl === -1) {
        await redis.del(key);
        removed += 1;
      }
    }
  } while (cursor !== '0');
  return removed;
}

// ── session.cleanup (quotidien) ────────────────────────────
export const SESSION_CLEANUP_QUEUE_NAME = 'session.cleanup';
const sessionCleanupQueue = new Queue(SESSION_CLEANUP_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: { removeOnComplete: 100, removeOnFail: 100 },
});

/** Purge des sessions expirées en base (backup PG). */
export async function cleanupExpiredSessions(): Promise<number> {
  const rows = await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date())).returning({ id: schema.sessions.id });
  return rows.length;
}

// ── user.suggestions (quotidien 03h00) ─────────────────────
export const USER_SUGGESTIONS_QUEUE_NAME = 'user.suggestions';
const userSuggestionsQueue = new Queue(USER_SUGGESTIONS_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: { removeOnComplete: 100, removeOnFail: 100 },
});

/** Pré-génère les suggestions de connexion des utilisateurs actifs. */
export async function generateDailySuggestions(limit = 100): Promise<number> {
  const users = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.profileCompleted, true))
    .limit(limit);
  let generated = 0;
  for (const user of users) {
    try {
      const { suggestions } = await getSuggestions(user.id);
      generated += suggestions.length;
    } catch {
      // profil incomplet ou données instables : on ignore
    }
  }
  return generated;
}

// ── temporal-message.reveal (toutes les minutes) ──────────
export const TEMPORAL_MESSAGE_REVEAL_QUEUE_NAME = 'temporal-message.reveal';
const temporalMessageRevealQueue = new Queue(TEMPORAL_MESSAGE_REVEAL_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: { removeOnComplete: 100, removeOnFail: 100 },
});

export async function revealTemporalMessages(): Promise<number> {
  return revealDueTemporalMessages(100);
}

// ── Scheduler global ───────────────────────────────────────
const SCHEDULERS: Array<{ queue: Queue; cron: string; process: () => Promise<unknown>; name: string }> = [
  { queue: presenceCleanupQueue, cron: '*/5 * * * *', process: cleanupPresenceKeys, name: PRESENCE_CLEANUP_QUEUE_NAME },
  { queue: sessionCleanupQueue, cron: '0 4 * * *', process: cleanupExpiredSessions, name: SESSION_CLEANUP_QUEUE_NAME },
  { queue: userSuggestionsQueue, cron: '0 3 * * *', process: () => generateDailySuggestions(), name: USER_SUGGESTIONS_QUEUE_NAME },
  { queue: temporalMessageRevealQueue, cron: '* * * * *', process: revealTemporalMessages, name: TEMPORAL_MESSAGE_REVEAL_QUEUE_NAME },
];

const workers: Worker[] = [];

/** Démarre les workers + planifie les crons (appelé uniquement dans index.ts). */
export function startCronWorkers(): void {
  if (workers.length > 0) return;
  for (const scheduler of SCHEDULERS) {
    const worker = new Worker(
      scheduler.name,
      async () => {
        const result = await scheduler.process();
        logger.info({ queue: scheduler.name, result }, 'cron exécuté');
      },
      { connection: { url: env.REDIS_URL }, concurrency: 1 },
    );
    worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err: { message: err.message } }, `cron ${scheduler.name} échoué`);
    });
    workers.push(worker);
    void scheduler.queue.add('cron', {}, { repeat: { pattern: scheduler.cron }, jobId: `cron-${scheduler.name}` });
  }
}

export async function closeCronQueues(): Promise<void> {
  await Promise.allSettled(workers.map((w) => w.close()));
  await Promise.allSettled(SCHEDULERS.map((s) => s.queue.close()));
}
