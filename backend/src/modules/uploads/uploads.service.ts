import { randomBytes } from 'node:crypto';
import { mediaBucket, minio } from '../../infrastructure/minio';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { rateLimitHit } from '../../shared/utils/rate-limit';
import { MIME_WHITELIST, type UploadRequestInput } from './uploads.schemas';
import { enqueueMediaProcess, type MediaProcessJob } from '../media/media.queue';

export const UPLOAD_REQUESTS_PER_HOUR = 60;
const UPLOAD_ID_TTL = 10 * 60; // 10 min
const PRESIGNED_EXPIRY = 10 * 60; // 10 min
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

const uploadKey = (uploadId: string) => `upload:${uploadId}`;

interface UploadRecord {
  userId: string;
  objectKey: string;
  contentType: string;
  size: number;
  purpose: string;
  createdAt: number;
}

/** Nettoyage défensif d'un nom de fichier (jamais utilisé tel quel pour l'objet). */
export function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[.-]+/, '')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/\.{2,}/g, '.');
}

/**
 * POST /api/uploads/request — valide le type/taille, génère une clé d'objet
 * et retourne une URL présignée PUT (upload direct côté client vers MinIO).
 */
export async function requestUpload(userId: string, input: UploadRequestInput): Promise<{
  uploadId: string;
  objectKey: string;
  contentType: string;
  presignedUrl: string;
  expiresIn: number;
}> {
  const mime = MIME_WHITELIST[input.contentType];
  if (!mime) {
    throw AppError.badRequest(
      'Type de fichier non autorisé. Formats acceptés : jpg, png, webp, gif, heic, mp4, mov, webm, mp3, wav, ogg.',
      'CONTENT_TYPE_NOT_ALLOWED',
    );
  }

  const maxBytes = input.purpose === 'avatar' ? Math.min(mime.maxBytes, AVATAR_MAX_BYTES) : mime.maxBytes;
  if (input.size > maxBytes) {
    throw AppError.badRequest(
      `Fichier trop volumineux pour ${input.purpose} (${mime.kind === 'video' ? '100 Mo' : input.purpose === 'avatar' ? '5 Mo' : '10 Mo'} max)`,
      'FILE_TOO_LARGE',
    );
  }

  const limit = await rateLimitHit(`upload:req:${userId}`, UPLOAD_REQUESTS_PER_HOUR, 60 * 60);
  if (!limit.allowed) {
    throw AppError.tooMany('Limite de demandes d’upload atteinte, réessayez plus tard', 'UPLOAD_RATE_LIMITED');
  }

  const uploadId = randomBytes(16).toString('hex');
  const objectKey = `${input.purpose}/${userId}/${Date.now()}-${randomBytes(6).toString('hex')}${mime.ext}`;

  const record: UploadRecord = {
    userId,
    objectKey,
    contentType: input.contentType,
    size: input.size,
    purpose: input.purpose,
    createdAt: Date.now(),
  };
  await redis.set(uploadKey(uploadId), JSON.stringify(record), 'EX', UPLOAD_ID_TTL);

  const presignedUrl = await minio.presignedPutObject(mediaBucket, objectKey, PRESIGNED_EXPIRY);
  return { uploadId, objectKey, contentType: input.contentType, presignedUrl, expiresIn: PRESIGNED_EXPIRY };
}

/**
 * POST /api/uploads/complete — vérifie que l'objet a bien été uploadé puis
 * enfile le traitement (thumbnails) dans la queue BullMQ `media.process`.
 */
export async function completeUpload(
  userId: string,
  uploadId: string,
): Promise<{ objectKey: string; contentType: string; status: 'processing' }> {
  const raw = await redis.get(uploadKey(uploadId));
  if (!raw) {
    throw AppError.badRequest('Demande d’upload inconnue ou expirée', 'UPLOAD_NOT_FOUND');
  }
  const record = JSON.parse(raw) as UploadRecord;
  if (record.userId !== userId) {
    throw AppError.forbidden('Cette demande d’upload ne vous appartient pas', 'UPLOAD_FORBIDDEN');
  }

  try {
    await minio.statObject(mediaBucket, record.objectKey);
  } catch {
    throw AppError.badRequest('Fichier introuvable sur le stockage. Re-téléversez.', 'OBJECT_NOT_FOUND');
  }

  const job: MediaProcessJob = {
    uploadId,
    userId,
    objectKey: record.objectKey,
    contentType: record.contentType,
    size: record.size,
    purpose: record.purpose,
  };
  await enqueueMediaProcess(job);

  await redis.del(uploadKey(uploadId));
  return { objectKey: record.objectKey, contentType: record.contentType, status: 'processing' };
}

export type { UploadRecord };
