import { Hono } from 'hono';
import { requireAuth } from '../auth/require-auth';
import { getExploreData } from './explore.service';

const exploreRoutes = new Hono();

exploreRoutes.use('*', requireAuth);

/** GET /api/explore — agrège tribus, companions, images, vidéos pour la page Explorer. */
exploreRoutes.get('/explore', async (c) => {
  const { userId } = c.get('auth');
  const data = await getExploreData(userId);
  return c.json(data, 200);
});

export { exploreRoutes };
