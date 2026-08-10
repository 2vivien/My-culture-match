import { serve } from '@hono/node-server';
import { env } from './config/env';
import { createApp } from './app';
import { closeDatabase } from './infrastructure/database';
import { closeRedis } from './infrastructure/redis';
import { closeMeilisearch } from './infrastructure/meilisearch';
import { ensureBucket } from './infrastructure/minio';
import { logger } from './middleware/logger';
import { startEmailWorker, closeEmailQueue } from './modules/email/email.queue';

async function bootstrap() {
  // Préparation des ressources externes au démarrage
  try {
    await ensureBucket();
  } catch (err) {
    logger.warn({ err: { message: String(err) } }, 'minio : bucket non initialisé (hors-ligne ?)');
  }

  // Worker d'emails (BullMQ)
  startEmailWorker();

  const app = createApp();

  const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    logger.info(`API prête sur http://localhost:${info.port} (${env.NODE_ENV})`);
  });

  // Shutdown gracieux : arrête les connexions avant de quitter
  const shutdown = (signal: string) => {
    logger.info(`Signal ${signal} reçu, arrêt en cours…`);
    server.close(async () => {
      await Promise.allSettled([closeDatabase(), closeRedis(), closeMeilisearch(), closeEmailQueue()]);
      process.exit(0);
    });
    // Filet de sécurité si la fermeture traîne
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.fatal(
    { err: { name: err?.name, message: err?.message, stack: err?.stack } },
    'Échec du démarrage',
  );
  process.exit(1);
});
