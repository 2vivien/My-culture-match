import * as Sentry from '@sentry/node';
import { env } from '../../config/env';
import { logger } from '../../middleware/logger';

/**
 * SENTRY (MP18) — capture d'erreurs avec contexte utilisateur.
 * Actif uniquement si SENTRY_DSN est défini dans l'environnement.
 */
let enabled = false;

export function initSentry(): void {
  if (!env.SENTRY_DSN) {
    logger.info('Sentry désactivé (SENTRY_DSN absent)');
    return;
  }
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0,
    serverName: `myculturematch-backend-${env.NODE_ENV}`,
  });
  enabled = true;
  logger.info('Sentry initialisé');
}

export function isSentryEnabled(): boolean {
  return enabled;
}

/** Capture une erreur (no-op si Sentry désactivé). */
export function captureError(
  err: unknown,
  context?: { requestId?: string; userId?: string; email?: string },
): void {
  if (!enabled) return;
  Sentry.withScope((scope) => {
    if (context?.requestId) scope.setTag('requestId', context.requestId);
    if (context?.userId) {
      scope.setUser({ id: context.userId, email: context.email });
    }
    Sentry.captureException(err);
  });
}
