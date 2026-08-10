import { Hono } from 'hono';
import { requestId } from './middleware/request-id';
import { httpLogger } from './middleware/logger';
import { errorHandler } from './middleware/error-handler';
import { cors } from './middleware/cors';
import { healthModule } from './modules/health/health.module';
import { authModule } from './modules/auth/auth.routes';
import { onboardingModule } from './modules/onboarding/onboarding.routes';
import { usersModule } from './modules/users/users.routes';
import { settingsModule } from './modules/settings/settings.routes';
import { uploadsModule } from './modules/uploads/uploads.routes';

export type AppBindings = {
  Variables: {
    requestId: string;
  };
};

/** Construit l'application Hono complète (testable sans serveur). */
export function createApp(): Hono<AppBindings> {
  const app = new Hono<AppBindings>();

  // Middlewares globaux (ordre = ordre d'exécution)
  app.use('*', requestId);
  app.use('*', cors);
  app.use('*', httpLogger);

  // Routes
  app.route('/health', healthModule);
  app.route('/api/auth', authModule);
  app.route('/api/onboarding', onboardingModule);
  app.route('/api/users', usersModule);
  app.route('/api/settings', settingsModule);
  app.route('/api/uploads', uploadsModule);

  // 404 JSON
  app.notFound((c) =>
    c.json(
      {
        error: { code: 'NOT_FOUND', message: `Route introuvable : ${c.req.method} ${c.req.path}` },
      },
      404,
    ),
  );

  // Handler d'erreurs global
  app.onError(errorHandler);

  return app;
}
