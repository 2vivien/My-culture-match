import { Queue, Worker } from 'bullmq';
import sharp from 'sharp';
import { env } from '../../config/env';
import { mediaBucket, minio } from '../../infrastructure/minio';
import { redis } from '../../infrastructure/redis';
import { logger } from '../../middleware/logger';

export const MEDIA_QUEUE_NAME = 'media.process';

/** Job de traitement média (thumbnail / validation). */
export interface MediaProcessJob {
  uploadId: string;
  userId: string;
  objectKey: string;
  contentType: string;
  size: number;
  purpose: string;
}

/** File BullMQ — traitement post-upload. */
export const mediaQueue = new Queue<MediaProcessJob>(MEDIA_QUEUE_NAME, {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: 1_000,
    removeOnFail: 5_000,
  },
});

export async function enqueueMediaProcess(job: MediaProcessJob): Promise<void> {
  await mediaQueue.add('process', job);
}

const doneKey = (uploadId: string) => `media:done:${uploadId}`;
const DONE_TTL = 24 * 60 * 60; // 24h

interface ProcessResult {
  uploadId: string;
  userId: string;
  objectKey: string;
  contentType: string;
  thumbKey: string | null;
  width: number | null;
  height: number | null;
  status: 'done';
}

/** Récupère le résultat de traitement d'un upload. */
export async function getMediaProcessResult(uploadId: string): Promise<ProcessResult | null> {
  const raw = await redis.get(doneKey(uploadId));
  return raw ? (JSON.parse(raw) as ProcessResult) : null;
}

const IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']);

/**
 * Traitement d'un job media.process :
 * - images : génère une miniature 400px (Sharp) stockée sous thumbs/…
 * - vidéos/audio : valide le fichier (metadata) — transcodage FFmpeg prévu
 *   dans une phase ultérieure.
 */
async function processJob(job: MediaProcessJob): Promise<void> {
  const { uploadId, objectKey, contentType } = job;

  let thumbKey: string | null = null;
  let width: number | null = null;
  let height: number | null = null;

  const file = await minio.getObject(mediaBucket, objectKey);
  const chunks: Buffer[] = [];
  for await (const chunk of file) {
    if (typeof chunk === 'string') chunks.push(Buffer.from(chunk));
    else chunks.push(chunk as Buffer);
  }
  const body = Buffer.concat(chunks);

  if (IMAGE_CONTENT_TYPES.has(contentType)) {
    const image = sharp(body, { failOn: 'none' }).rotate();
    const metadata = await image.metadata();
    width = metadata.width ?? null;
    height = metadata.height ?? null;

    const thumb = await image
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    thumbKey = `thumbs/${objectKey.replace(/\/[^/]+$/, '')}/thumb.webp`;
    await minio.putObject(mediaBucket, thumbKey, thumb, thumb.length, { 'content-type': 'image/webp' });
  } else {
    // vidéo/audio : pas de transcodage disponible — on valide et on garde l'objet
    if (body.length === 0) {
      throw new Error(`Objet vide : ${objectKey}`);
    }
  }

  const result: ProcessResult = {
    uploadId,
    userId: job.userId,
    objectKey,
    contentType,
    thumbKey,
    width,
    height,
    status: 'done',
  };
  await redis.set(doneKey(uploadId), JSON.stringify(result), 'EX', DONE_TTL);
}

// ── Worker BullMQ ──────────────────────────────────────────
let worker: Worker<MediaProcessJob> | null = null;

export function startMediaWorker(): Worker<MediaProcessJob> {
  if (worker) return worker;

  worker = new Worker<MediaProcessJob>(
    MEDIA_QUEUE_NAME,
    async (job) => {
      logger.info({ jobId: job.id, objectKey: job.data.objectKey }, 'traitement média');
      await processJob(job.data);
    },
    { connection: { url: env.REDIS_URL }, concurrency: 2 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: { message: err.message } }, 'traitement média échoué');
  });

  return worker;
}

export async function closeMediaQueue(): Promise<void> {
  await worker?.close();
  await mediaQueue.close();
}
