import { randomUUID } from 'node:crypto';
import type { Context, Next } from 'hono';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Attribue un identifiant unique à chaque requête (X-Request-Id)
 * pour le tracing dans les logs et le support client.
 */
export async function requestId(c: Context, next: Next) {
  const incoming = c.req.header(REQUEST_ID_HEADER);
  const id = incoming && /^[A-Za-z0-9-]{8,64}$/.test(incoming) ? incoming : randomUUID();
  c.set('requestId', id);
  c.header(REQUEST_ID_HEADER, id);
  await next();
}
