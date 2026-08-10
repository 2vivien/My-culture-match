import { Queue, Worker } from 'bullmq';
import { env } from '../../config/env';
import { logger } from '../../middleware/logger';
import { flushCounters, getDirtyPostIds } from './counters';
import { flushTribeVisitors } from './counters';

export const COUNTERS_FLUSH_QUEUE_NAME = 'counters.flush';
const FLUSH_INTERVAL_MS = 5 * 60 * 1_000;

const queue = new Queue(COUNTERS_FLUSH_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: { removeOnComplete: 1_000, removeOnFail: 5_000 },
});

let worker: Worker | null = null;

/**
 * Worker `counters.flush` : toutes les 5 minutes, applique en batch les deltas
 * Redis des compteurs de posts (likes, comments, views…) et des visiteurs de
 * tribus vers PostgreSQL.
 */
export function startCountersFlushWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(
    COUNTERS_FLUSH_QUEUE_NAME,
    async (job) => {
      if (job.name === 'flush') {
        const postIds = await getDirtyPostIds(1_000);
        const postsFlushed = await flushCounters(postIds);
        const tribesFlushed = await flushTribeVisitors();
        return { postsFlushed, tribesFlushed };
      }
      return null;
    },
    { connection: { url: env.REDIS_URL }, concurrency: 1 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: { message: err.message } }, 'flush counters échoué');
  });

  // Planification du job périodique
  void queue.upsertJobScheduler(
    'every-5-min',
    { every: FLUSH_INTERVAL_MS },
    { name: 'flush', data: {} },
  );

  return worker;
}

export async function closeCountersFlushQueue(): Promise<void> {
  await worker?.close();
  await queue.close();
}
