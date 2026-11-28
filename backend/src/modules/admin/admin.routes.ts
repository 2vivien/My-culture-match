import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { requireAdmin } from '../auth/require-admin';
import { analyticsQuerySchema, banUserSchema, listAdminUsersQuerySchema, listReportsQuerySchema, reportActionSchema, unbanUserSchema } from './admin.schemas';
import { banUser, getAdminStats, getAnalytics, getRecentActivity, getSystemHealth, listAdminUsers, listAuditLogs, listReports, logAudit, takeReportAction, unbanUser } from './admin.service';
import { getLoveMetricsSummary } from '../love/love.metrics.service';

const adminRoutes = new Hono();

adminRoutes.use('*', requireAuth);
adminRoutes.use('*', requireAdmin);

/** GET /api/admin/reports?status=&cursor=&limit= */
adminRoutes.get('/reports', zValidator('query', listReportsQuerySchema), async (c) => {
  const { status, cursor, limit } = c.req.valid('query');
  const { userId } = c.get('auth');
  const result = await listReports({ status, cursor, limit });
  await logAudit(userId, 'reports.list', { status, limit }, metaOf(c));
  return c.json(result, 200);
});

/** POST /api/admin/reports/:id/action */
adminRoutes.post('/reports/:id/action', zValidator('json', reportActionSchema), async (c) => {
  const { action, reason } = c.req.valid('json');
  const { userId } = c.get('auth');
  const result = await takeReportAction(c.req.param('id'), userId, action, reason, metaOf(c));
  return c.json(result, 200);
});

/** GET /api/admin/users?search=&status=&cursor=&limit= */
adminRoutes.get('/users', zValidator('query', listAdminUsersQuerySchema), async (c) => {
  const { search, status, cursor, limit } = c.req.valid('query');
  const result = await listAdminUsers({ search, status, cursor, limit });
  return c.json(result, 200);
});

/** POST /api/admin/users/:id/ban */
adminRoutes.post('/users/:id/ban', zValidator('json', banUserSchema), async (c) => {
  const { reason, durationDays } = c.req.valid('json');
  const { userId } = c.get('auth');
  const result = await banUser(c.req.param('id'), userId, reason, durationDays, metaOf(c));
  return c.json(result, 200);
});

/** POST /api/admin/users/:id/unban */
adminRoutes.post('/users/:id/unban', zValidator('json', unbanUserSchema), async (c) => {
  const { reason } = c.req.valid('json');
  const { userId } = c.get('auth');
  const result = await unbanUser(c.req.param('id'), userId, reason, metaOf(c));
  return c.json(result, 200);
});

/** GET /api/admin/stats */
adminRoutes.get('/stats', async (c) => {
  const result = await getAdminStats();
  return c.json(result, 200);
});

/** GET /api/admin/analytics?period=7d|30d|90d|12m */
adminRoutes.get('/analytics', zValidator('query', analyticsQuerySchema), async (c) => {
  const { period } = c.req.valid('query');
  const result = await getAnalytics(period);
  return c.json(result, 200);
});

/** GET /api/admin/love/metrics — entonnoir Love agrégé (aucun identifiant ni contenu). */
adminRoutes.get('/love/metrics', async (c) => {
  return c.json(await getLoveMetricsSummary(), 200);
});

/** GET /api/admin/logs — journal d'audit. */
adminRoutes.get('/logs', async (c) => {
  const result = await listAuditLogs({ cursor: c.req.query('cursor'), limit: c.req.query('limit') ? Number(c.req.query('limit')) : undefined });
  return c.json(result, 200);
});

/** GET /api/admin/activity — dernière activité. */
adminRoutes.get('/activity', async (c) => {
  const result = await getRecentActivity({ limit: c.req.query('limit') ? Number(c.req.query('limit')) : undefined });
  return c.json(result, 200);
});

/** GET /api/admin/health — métriques système. */
adminRoutes.get('/health', async (c) => {
  const result = await getSystemHealth();
  return c.json(result, 200);
});

function metaOf(c: { req: { header: (name: string) => string | undefined } }) {
  return { ip: c.req.header('x-forwarded-for')?.split(',')[0]?.trim(), userAgent: c.req.header('user-agent') };
}

export { adminRoutes };
