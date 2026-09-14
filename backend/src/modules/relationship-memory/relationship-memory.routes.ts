import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../middleware/auth';
import { AppError } from '../../shared/utils/AppError';
import { createRelationshipCapsule, getRelationshipTimeline, rebuildRelationshipMemory } from './relationship-memory.service';

const routes = new Hono();
routes.use('*', requireAuth);

const capsuleSchema = z.object({
  title: z.string().trim().max(160).optional(),
  body: z.string().trim().max(12_000).optional(),
  mediaUrls: z.array(z.string().url()).max(20).optional(),
  eventDate: z.string().datetime().optional(),
});

routes.get('/conversations/:id/relationship-timeline', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await getRelationshipTimeline(c.req.param('id'), userId), 200);
});

routes.post('/conversations/:id/relationship-memory/rebuild', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await rebuildRelationshipMemory(c.req.param('id'), userId), 200);
});

routes.post('/conversations/:id/relationship-capsules', zValidator('json', capsuleSchema), async (c) => {
  const { userId } = c.get('auth');
  const payload = c.req.valid('json');
  if (!payload.body?.trim() && !(payload.mediaUrls?.length)) throw AppError.badRequest('Ajoute une note ou une photo/vidéo à la capsule', 'EMPTY_CAPSULE');
  return c.json(await createRelationshipCapsule({ conversationId: c.req.param('id'), userId, ...payload }), 201);
});

export { routes as relationshipMemoryRoutes };
