import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import type { Queue } from 'bullmq';
import type { Context, Next } from 'hono';

/**
 * MÉTRIQUES PROMETHEUS (MP18).
 * - HTTP : http_requests_total + http_request_duration_seconds (histogram)
 * - Métier : posts / messages / matchs / notifications créés
 * - Infra : profondeur des queues BullMQ (gauge, échantillonnée)
 * Le registre est exposé sur GET /metrics au format Prometheus.
 */

const registry = new Registry();

// Métriques Node.js (GC, event loop, mémoire) — démarrées uniquement en
// bootstrap via startNodeMetrics() pour ne pas bloquer la sortie des tests.
export function startNodeMetrics(): void {
  collectDefaultMetrics({ register: registry, prefix: 'mcm_node_' });
}

// ── HTTP ───────────────────────────────────────────────────
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total des requêtes HTTP par méthode, chemin et statut.',
  labelNames: ['method', 'path', 'status'] as const,
  registers: [registry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes.',
  labelNames: ['method', 'path', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

// ── MÉTIER ─────────────────────────────────────────────────
export const postsCreatedTotal = new Counter({
  name: 'posts_created_total',
  help: 'Nombre de posts créés.',
  registers: [registry],
});
export const messagesSentTotal = new Counter({
  name: 'messages_sent_total',
  help: 'Nombre de messages envoyés.',
  registers: [registry],
});
export const matchesCreatedTotal = new Counter({
  name: 'matches_created_total',
  help: 'Nombre de matchs mutuels créés (love).',
  registers: [registry],
});
export const notificationsSentTotal = new Counter({
  name: 'notifications_sent_total',
  help: 'Nombre de notifications créées.',
  registers: [registry],
});

// ── INFRA ──────────────────────────────────────────────────
export const queueDepth = new Gauge({
  name: 'queue_depth',
  help: 'Nombre de jobs en attente (waiting+delayed+paused) par queue BullMQ.',
  labelNames: ['queue'] as const,
  registers: [registry],
});

/** Normalise un chemin pour éviter une cardinalité infinie (ids → /:id). */
const UUID_PATH = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const NUMERIC_PATH = /\/[0-9]+/g;
export function normalizePath(path: string): string {
  return path.replace(UUID_PATH, '/:id').replace(NUMERIC_PATH, '/:id');
}

/** Middleware : mesure chaque requête HTTP (après réponse). */
export async function metricsMiddleware(c: Context, next: Next): Promise<void> {
  const start = performance.now();
  await next();
  const method = c.req.method;
  const path = normalizePath(c.req.path);
  const status = String(c.res.status);
  httpRequestsTotal.inc({ method, path, status });
  httpRequestDurationSeconds.observe({ method, path, status }, (performance.now() - start) / 1000);
}

/** GET /metrics — rendu texte Prometheus. */
export async function renderMetrics(): Promise<Response> {
  return new Response(await registry.metrics(), {
    headers: { 'content-type': registry.contentType },
  });
}

/** Échantillonne la profondeur des queues BullMQ (intervalle). */
export function startQueueMetricsSampler(
  queues: Array<{ name: string; queue: Queue }>,
  intervalMs = 15_000,
): NodeJS.Timeout {
  const sample = (): void => {
    for (const { name, queue } of queues) {
      queue
        .getJobCounts()
        .then((counts) => {
          const waiting =
            (counts.waiting ?? 0) + (counts.delayed ?? 0) + (counts.paused ?? 0);
          queueDepth.set({ queue: name }, waiting);
        })
        .catch(() => {
          /* queue indisponible : on garde la dernière valeur */
        });
    }
  };
  sample();
  return setInterval(sample, intervalMs);
}
