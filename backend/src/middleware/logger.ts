import { createRequire } from 'node:module';
import { pino } from 'pino';
import { env } from '../config/env';

const require = createRequire(import.meta.url);
const prettyTarget = require.resolve('pino-pretty');

export const logger = pino({
  level: env.LOG_LEVEL,
  base: undefined,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
    censor: '[REDACTED]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: prettyTarget,
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        }
      : undefined,
});

/** Middleware de log HTTP (méthode, chemin, statut, durée). */
export async function httpLogger(c: import('hono').Context, next: import('hono').Next) {
  const start = performance.now();
  const requestId = c.get('requestId') as string | undefined;
  await next();
  const durationMs = Math.round(performance.now() - start);
  const fields = { requestId, method: c.req.method, path: c.req.path, status: c.res.status, durationMs };
  if (c.res.status >= 500) {
    logger.error(fields, 'http');
  } else {
    logger.info(fields, 'http');
  }
}
