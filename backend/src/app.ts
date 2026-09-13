import { Hono } from 'hono';
import { requestId } from './middleware/request-id';
import { httpLogger } from './middleware/logger';
import { errorHandler } from './middleware/error-handler';
import { metricsMiddleware, renderMetrics } from './infrastructure/monitoring/metrics';
import { cors } from './middleware/cors';
import { env } from './config/env';
import { healthModule } from './modules/health/health.module';
import { authModule } from './modules/auth/auth.routes';
import { onboardingModule } from './modules/onboarding/onboarding.routes';
import { usersModule } from './modules/users/users.routes';
import { settingsModule } from './modules/settings/settings.routes';
import { uploadsModule } from './modules/uploads/uploads.routes';
import { postsModule } from './modules/posts/posts.routes';
import { tribesModule, tribuModule } from './modules/tribes/tribes.routes';
import { messagesRoutes } from './modules/messages/messages.routes';
import { connectionsRoutes } from './modules/connections/connections.routes';
import { locationRoutes } from './modules/location/location.routes';
import { consentRoutes } from './modules/consent/consent.routes';
import { safetyRoutes } from './modules/safety/safety.routes';
import { loveRoutes } from './modules/love/love.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { storiesRoutes } from './modules/stories/stories.routes';
import { searchRoutes } from './modules/search/search.routes';
import { feedRoutes } from './modules/feed/feed.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { reportsRoutes } from './modules/reports/reports.routes';
import { exploreRoutes } from './modules/explore/explore.routes';

export type AppBindings = { Variables: { requestId: string; correlationId: string } };

export function createApp(): Hono<AppBindings> {
  const app = new Hono<AppBindings>();
  app.use('*', requestId); app.use('*', cors); app.use('*', httpLogger); app.use('*', metricsMiddleware);
  app.get('/metrics', (c) => { const auth=c.req.header('Authorization')?.replace(/^Bearer\s+/i,''); const xToken=c.req.header('X-Metrics-Token'); if(env.METRICS_TOKEN){if(auth!==env.METRICS_TOKEN&&xToken!==env.METRICS_TOKEN)return c.json({error:{code:'UNAUTHORIZED',message:'Token de métriques invalide'}},401);}else if(env.NODE_ENV==='production')return c.json({error:{code:'UNAUTHORIZED',message:'Métriques non exposées'}},401);return renderMetrics(); });
  app.route('/health', healthModule); app.route('/api/auth', authModule); app.route('/api/onboarding', onboardingModule); app.route('/api/users', usersModule); app.route('/api/settings', settingsModule); app.route('/api/uploads', uploadsModule); app.route('/api/posts', postsModule); app.route('/api/tribes', tribesModule); app.route('/api/tribu', tribuModule); app.route('/api', messagesRoutes); app.route('/api', connectionsRoutes); app.route('/api', locationRoutes); app.route('/api', consentRoutes); app.route('/api', safetyRoutes); app.route('/api', loveRoutes); app.route('/api', notificationsRoutes); app.route('/api', storiesRoutes); app.route('/api', searchRoutes); app.route('/api', feedRoutes); app.route('/api', reportsRoutes); app.route('/api', exploreRoutes); app.route('/api/admin', adminRoutes);
  app.notFound((c)=>c.json({error:{code:'NOT_FOUND',message:`Route introuvable : ${c.req.method} ${c.req.path}`}},404));
  app.onError(errorHandler); return app;
}
