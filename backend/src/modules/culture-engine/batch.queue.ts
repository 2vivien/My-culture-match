import { Queue, Worker } from 'bullmq';
import { env } from '../../config/env';
import { logger } from '../../middleware/logger';
import { recomputeAllProfileVectors } from './profile-vector';
import { computeHealthMetrics } from './health';

export const CULTURE_BATCH_QUEUE_NAME = 'culture-engine.batch';

export interface CultureBatchJob {
  day?: string; // 'YYYY-MM-DD'
}

export const cultureBatchQueue = new Queue<CultureBatchJob>(CULTURE_BATCH_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: 100,
    removeOnFail: 1_000,
  },
});

export async function enqueueCultureEngineBatch(day?: string): Promise<void> {
  await cultureBatchQueue.add('batch', { day });
}

/** Batch nightly : recalcule les vecteurs de profil + métriques de santé. */
export async function processCultureBatch(job: CultureBatchJob): Promise<{ vectors: number; metrics: Record<string, number> }> {
  const vectors = await recomputeAllProfileVectors();
  const metrics = await computeHealthMetrics(job.day ? new Date(`${job.day}T00:00:00Z`) : new Date());
  return { vectors, metrics };
}

let worker: Worker<CultureBatchJob> | null = null;

export function startCultureEngineWorker(): Worker<CultureBatchJob> {
  if (worker) return worker;
  worker = new Worker<CultureBatchJob>(
    CULTURE_BATCH_QUEUE_NAME,
    async (job) => {
      await processCultureBatch(job.data);
    },
    { connection: { url: env.REDIS_URL }, concurrency: 1 },
  );
  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: { message: err.message } }, 'batch culture engine échoué');
  });
  return worker;
}

/** Planifie le batch nightly à 02h00 (job unique, idempotent). */
export async function scheduleNightlyCultureBatch(): Promise<void> {
  await cultureBatchQueue.add('batch', {}, { repeat: { pattern: '0 2 * * *' }, jobId: 'culture-engine-nightly' });
}

export async function closeCultureEngineQueue(): Promise<void> {
  await worker?.close();
  await cultureBatchQueue.close();
}
