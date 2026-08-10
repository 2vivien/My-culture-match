import type { Context, Next } from 'hono';

const FRONTEND_ALLOWED_ORIGINS = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/** Middleware CORS adapté au frontend (crédentials + origines listées). */
export async function cors(c: Context, next: Next) {
  const origin = c.req.header('Origin');

  if (origin && FRONTEND_ALLOWED_ORIGINS.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Vary', 'Origin');
  }

  c.header('Access-Control-Allow-Credentials', 'true');
  c.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-request-id',
  );
  c.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  );
  c.header('Access-Control-Max-Age', '600');

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }

  await next();
}
