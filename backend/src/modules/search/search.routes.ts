import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { searchQuerySchema } from './search.schemas';
import { search } from './search.service';

const searchRoutes = new Hono();

searchRoutes.use('*', requireAuth);

/** GET /api/search?q=&type=&limit=&offset= — recherche multi-entités. */
searchRoutes.get('/search', zValidator('query', searchQuerySchema), async (c) => {
  const { q, type, limit, offset } = c.req.valid('query');
  const { userId } = c.get('auth');
  const results = await search(userId, q, type, limit, offset);
  return c.json(results, 200);
});

export { searchRoutes };
