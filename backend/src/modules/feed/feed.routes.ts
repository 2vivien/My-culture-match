import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { optionalAuth } from '../auth/optional-auth';
import type { AuthContext } from '../auth/require-auth';
import { getFeed, getGuestFeed } from './feed.service';
import { listFeedQuerySchema } from './feed.schemas';

const feedRoutes = new Hono();

/**
 * Le feed est public en lecture : un visiteur voit les publications récentes,
 * un membre connecté conserve le classement personnalisé du Culture Engine.
 */
feedRoutes.use('*', optionalAuth);

/** GET /api/feed?filter=tribes|following|for-you|popular|new&limit=&cursor= */
feedRoutes.get('/feed', zValidator('query', listFeedQuerySchema), async (c) => {
  const { filter, limit, cursor } = c.req.valid('query');
  const auth = c.get('auth') as AuthContext | undefined;
  const result = auth
    ? await getFeed(auth.userId, filter, limit, cursor)
    : await getGuestFeed((filter === 'following' || filter === 'tribes') ? 'for-you' : filter, limit, cursor);
  return c.json(result, 200);
});

export { feedRoutes };
