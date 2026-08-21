import { randomUUID } from 'node:crypto';
import type { Context, Next } from 'hono';

export const REQUEST_ID_HEADER = 'x-request-id';
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Attribue un identifiant unique à chaque requête (X-Request-Id) pour le
 * tracing dans les logs, et fait transiter un ID de corrélation (utile pour
 * relier les requêtes d'une même opération client).
 */
export async function requestId(c: Context, next: Next) {
  const incoming = c.req.header(REQUEST_ID_HEADER);
  const id = incoming && /^[A-Za-z0-9-]{8,64}$/.test(incoming) ? incoming : randomUUID();
  c.set('requestId', id);
  c.header(REQUEST_ID_HEADER, id);

  const incomingCorrelation = c.req.header(CORRELATION_ID_HEADER);
  const correlationId =
    incomingCorrelation && /^[A-Za-z0-9-]{8,64}$/.test(incomingCorrelation)
      ? incomingCorrelation
      : id;
  c.set('correlationId', correlationId);
  c.header(CORRELATION_ID_HEADER, correlationId);

  await next();
}
