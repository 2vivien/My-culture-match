import { Redis } from 'ioredis';
import { env } from '../../config/env';

const sharedRedis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // requis par BullMQ
  enableReadyCheck: false,
  lazyConnect: false,
});

sharedRedis.on('error', (err) => {
  console.error('[redis] erreur de connexion :', err.message);
});

export const redis = sharedRedis;

export async function checkRedis(): Promise<void> {
  await redis.ping();
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
}
