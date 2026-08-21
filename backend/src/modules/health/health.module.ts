import { Hono } from 'hono';
import { checkDatabase } from '../../infrastructure/database';
import { checkRedis } from '../../infrastructure/redis';
import { checkMeilisearch } from '../../infrastructure/meilisearch';
import { checkMinio } from '../../infrastructure/minio';

/**
 * Endpoint /health : retourne l'état de chaque dépendance.
 * - /health            → état simple (200/503)
 * - /health/live       → le processus tourne (liveness)
 * - /health/ready      → toutes les dépendances répondent (readiness)
 */
export const healthModule = new Hono();

healthModule.get('/live', (c) =>
  c.json({ status: 'ok', uptime: process.uptime() }),
);

healthModule.get('/ready', async (c) => {
  const checks: Record<string, 'ok' | 'error'> = {};
  let healthy = true;

  const run = async (name: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      checks[name] = 'ok';
    } catch (err) {
      checks[name] = 'error';
      healthy = false;
      console.error(`[health] ${name} KO :`, err);
    }
  };

  await run('database', checkDatabase);
  await run('redis', checkRedis);
  await run('meilisearch', checkMeilisearch);
  await run('minio', checkMinio);

  return c.json({ status: healthy ? 'ok' : 'degraded', checks }, healthy ? 200 : 503);
});

healthModule.get('/', async (c) => {
  try {
    await checkDatabase();
    return c.json({ status: 'ok', service: 'myculturematch-backend' });
  } catch {
    return c.json({ status: 'error' }, 503);
  }
});
