import { createRequire } from 'node:module';
import {
  pino,
  multistream,
  transport as pinoTransport,
  destination as pinoDestination,
  type DestinationStream,
  type StreamEntry,
} from 'pino';
import { env } from '../config/env';
import { createBetterStackTransport } from '../infrastructure/monitoring/better-stack';

const require = createRequire(import.meta.url);

const streams: Array<DestinationStream | StreamEntry> = [];

if (env.NODE_ENV === 'development') {
  const prettyTarget = require.resolve('pino-pretty');
  streams.push(
    pinoTransport({
      target: prettyTarget,
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
    }),
  );
} else {
  streams.push(pinoDestination(1));
}

// Agrégation des logs vers Better Stack si BETTER_STACK_SOURCE_TOKEN est défini
const betterStack = createBetterStackTransport();
if (betterStack) streams.push({ stream: betterStack });

export const logger = pino(
  {
    level: env.LOG_LEVEL,
    base: undefined,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
      censor: '[REDACTED]',
    },
  },
  multistream(streams),
);

/** Middleware de log HTTP structuré (méthode, chemin, statut, durée, tracing). */
export async function httpLogger(c: import('hono').Context, next: import('hono').Next) {
  const start = performance.now();
  await next();
  const durationMs = Math.round(performance.now() - start);
  const auth = c.get('auth') as { userId: string } | undefined;
  const fields = {
    requestId: c.get('requestId') as string | undefined,
    correlationId: c.get('correlationId') as string | undefined,
    userId: auth?.userId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs,
  };
  if (c.res.status >= 500) {
    logger.error(fields, 'http');
  } else {
    logger.info(fields, 'http');
  }
}
