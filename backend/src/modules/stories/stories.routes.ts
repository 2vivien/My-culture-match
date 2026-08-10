import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { createStorySchema } from './stories.schemas';
import { createStory, getStories, recordStoryView } from './stories.service';

const storiesRoutes = new Hono();

storiesRoutes.use('*', requireAuth);

/** GET /api/stories — stories actives (miennes + connexions). */
storiesRoutes.get('/stories', async (c) => {
  const { userId } = c.get('auth');
  const stories = await getStories(userId);
  return c.json(stories, 200);
});

/** POST /api/stories — création { img | mediaUrl, type?, caption? }. */
storiesRoutes.post('/stories', zValidator('json', createStorySchema), async (c) => {
  const { userId } = c.get('auth');
  const input = c.req.valid('json');
  const story = await createStory(userId, input);
  return c.json(story, 201);
});

/** POST /api/stories/:id/view — enregistre une vue. */
storiesRoutes.post('/stories/:id/view', async (c) => {
  const { userId } = c.get('auth');
  const result = await recordStoryView(userId, c.req.param('id'));
  return c.json(result, 200);
});

export { storiesRoutes };
