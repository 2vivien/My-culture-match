import { Queue, Worker } from 'bullmq';
import { env } from '../../config/env';
import { mediaBucket, minio } from '../../infrastructure/minio';
import { logger } from '../../middleware/logger';
import {
  runMediaCleanup,
  type MediaCleanupJob,
  type MediaCleanupResult,
  type ObjectStorage,
} from './account.media';

export const ACCOUNT_CLEANUP_QUEUE_NAME = 'account.media-cleanup';

/**
 * Les clés d'objets contiennent l'identifiant de la personne : le job est donc retiré de Redis dès qu'il
 * réussit, et les jobs en échec ne sont gardés que 7 jours (le temps d'investiguer). Les journaux, eux,
 * ne contiennent ni identifiant ni clé : uniquement des compteurs.
 */
const FAILED_RETENTION_SECONDS = 7 * 24 * 3600;
export const CLEANUP_ATTEMPTS = 6;

export const accountCleanupQueue = new Queue<MediaCleanupJob>(ACCOUNT_CLEANUP_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: CLEANUP_ATTEMPTS,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: true,
    removeOnFail: { age: FAILED_RETENTION_SECONDS },
  },
});

export async function enqueueAccountMediaCleanup(job: MediaCleanupJob): Promise<void> {
  await accountCleanupQueue.add('cleanup', job);
}

/** Adaptateur MinIO du port de stockage utilisé par la logique pure. */
export const minioStorage: ObjectStorage = {
  async list(prefix) {
    const names: string[] = [];
    const stream = minio.listObjectsV2(mediaBucket, prefix, true);
    for await (const item of stream) {
      if (item.name) names.push(item.name);
    }
    return names;
  },
  async remove(keys) {
    // removeObject est idempotent côté S3 : un objet déjà absent n'est pas une erreur (utile au réessai).
    for (const key of keys) await minio.removeObject(mediaBucket, key);
  },
};

/** Exportée pour les tests d'intégration. */
export async function processAccountMediaCleanup(data: MediaCleanupJob): Promise<MediaCleanupResult> {
  return runMediaCleanup(data, minioStorage);
}

let worker: Worker<MediaCleanupJob> | null = null;

export function startAccountCleanupWorker(): Worker<MediaCleanupJob> {
  if (worker) return worker;
  worker = new Worker<MediaCleanupJob>(
    ACCOUNT_CLEANUP_QUEUE_NAME,
    async (job) => {
      const result = await processAccountMediaCleanup(job.data);
      // Journal d'audit sans donnée personnelle : ni identifiant, ni clé, ni nom de fichier.
      logger.info(
        { event: 'account.media_cleanup', jobId: job.id, attempt: job.attemptsMade + 1, removed: result.removed, skipped: result.skipped },
        'fichiers de compte supprimés',
      );
    },
    { connection: { url: env.REDIS_URL }, concurrency: 1 },
  );
  worker.on('failed', (job, err) => {
    const final = !!job && job.attemptsMade >= (job.opts.attempts ?? CLEANUP_ATTEMPTS);
    logger.error(
      { event: 'account.media_cleanup_failed', jobId: job?.id, attempt: job?.attemptsMade, final, errName: err.name },
      final ? 'suppression des fichiers de compte abandonnée' : 'suppression des fichiers de compte à réessayer',
    );
  });
  return worker;
}

export async function closeAccountCleanupQueue(): Promise<void> {
  await worker?.close();
  await accountCleanupQueue.close();
}
