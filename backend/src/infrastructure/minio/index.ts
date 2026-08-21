import { Client } from 'minio';
import { env } from '../../config/env';

export const minio = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export const mediaBucket = env.MINIO_BUCKET_NAME;

/** Crée le bucket s'il n'existe pas (appelé au bootstrap). */
export async function ensureBucket(): Promise<void> {
  const exists = await minio.bucketExists(mediaBucket);
  if (!exists) {
    await minio.makeBucket(mediaBucket, 'us-east-1');
  }
}

export async function checkMinio(): Promise<void> {
  await minio.bucketExists(mediaBucket);
}
