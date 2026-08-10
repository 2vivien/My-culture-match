import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { createReportSchema } from './reports.schemas';
import { createReport } from './reports.service';

const reportsRoutes = new Hono();

reportsRoutes.use('*', requireAuth);

/** POST /api/reports — signaler un contenu. */
reportsRoutes.post('/reports', zValidator('json', createReportSchema), async (c) => {
  const { userId } = c.get('auth');
  const result = await createReport(userId, c.req.valid('json'));
  return c.json(result, 201);
});

export { reportsRoutes };
