import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { getFeed } from './feed.service';
import { listFeedQuerySchema } from './feed.schemas';

const feedRoutes = new Hono();

feedRoutes.use('*', requireAuth);

/** GET /api/feed?filter=following|for-you|popular|new&limit=&cursor= */
feedRoutes.get('/feed', zValidator('query', listFeedQuerySchema), async (c) => {
  const { filter, limit, cursor } = c.req.valid('query');
  const { userId } = c.get('auth');
  const result = await getFeed(userId, filter, limit, cursor);
  return c.json(result, 200);
});

export { feedRoutes };
