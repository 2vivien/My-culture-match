import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { AppError } from '../shared/utils/AppError';
import { logger } from './logger';

/**
 * Gestionnaire d'erreurs global. Formate toutes les erreurs en JSON :
 * { error: { code, message, details? } } avec un code métier stable.
 */
export async function errorHandler(err: Error, c: Context): Promise<Response> {
  const requestId = c.get('requestId') as string | undefined;

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details } },
      400,
    );
  }

  if (err instanceof AppError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      },
      err.status as 400,
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      { error: { code: 'HTTP_ERROR', message: err.message } },
      err.status,
    );
  }

  logger.error(
    {
      requestId,
      err: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
    },
    'unhandled_error',
  );

  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erreur interne du serveur',
      },
    },
    500,
  );
}
