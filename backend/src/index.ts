import type { Server as HttpServer } from 'node:http';
import { serve } from '@hono/node-server';
import { env } from './config/env';
import { createApp } from './app';
import { closeDatabase } from './infrastructure/database';
import { closeRedis, redis } from './infrastructure/redis';
import { closeMeilisearch } from './infrastructure/meilisearch';
import { ensureBucket } from './infrastructure/minio';
import { initSocketServer } from './infrastructure/websocket';
import { logger } from './middleware/logger';
import { startEmailWorker, closeEmailQueue } from './modules/email/email.queue';
import { startCountersFlushWorker, closeCountersFlushQueue } from './modules/feed/counters.queue';
import { startStoriesCleanup, stopStoriesCleanup } from './modules/stories/stories.service';
import { startModerationWorker, closeModerationQueue } from './modules/moderation/moderation.queue';
import { startCultureEngineWorker, scheduleNightlyCultureBatch, closeCultureEngineQueue } from './modules/culture-engine/batch.queue';
import { startCronWorkers, closeCronQueues } from './modules/workers/crons';

async function bootstrap() {
  // Préparation des ressources externes au démarrage
  try {
    await ensureBucket();
  } catch (err) {
    logger.warn({ err: { message: String(err) } }, 'minio : bucket non initialisé (hors-ligne ?)');
  }

  // Worker d'emails (BullMQ)
  startEmailWorker();

  // Worker de flush des compteurs (likes/comments/views + visiteurs tribus)
  startCountersFlushWorker();

  // Worker d'auto-modération (scan toxique des posts/comments/stories)
  startModerationWorker();

  // Worker culture-engine (batch nightly : vecteurs + métriques de santé)
  startCultureEngineWorker();
  try {
    await scheduleNightlyCultureBatch();
  } catch (err) {
    logger.warn({ err: { message: String(err) } }, 'batch nightly déjà planifié');
  }

  // Crons : présence, sessions expirées, suggestions utilisateurs
  startCronWorkers();

  // Cron de purge des stories expirées (toutes les heures)
  startStoriesCleanup();

  const app = createApp();

  const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    logger.info(`API prête sur http://localhost:${info.port} (${env.NODE_ENV})`);
  });

  // Socket.io (messagerie temps réel) sur le même serveur HTTP
  initSocketServer(server as HttpServer, redis);

  // Shutdown gracieux : arrête les connexions avant de quitter
  const shutdown = (signal: string) => {
    logger.info(`Signal ${signal} reçu, arrêt en cours…`);
    server.close(async () => {
      await Promise.allSettled([closeDatabase(), closeRedis(), closeMeilisearch(), closeEmailQueue(), closeCountersFlushQueue(), closeModerationQueue(), closeCultureEngineQueue(), closeCronQueues()]);
      stopStoriesCleanup();
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
