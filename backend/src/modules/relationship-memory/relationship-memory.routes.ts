import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../../middleware/auth';
import { AppError } from '../../shared/utils/AppError';
import { createRelationshipCapsule, getRelationshipTimeline } from './relationship-memory.service';
import { generateRelationshipRecap, listRelationshipRecaps, rebuildRelationshipMemoryV2 } from './relationship-memory.v2';

const routes = new Hono();
routes.use('*', requireAuth);

const capsuleSchema = z.object({ title: z.string().trim().max(160).optional(), body: z.string().trim().max(12_000).optional(), mediaUrls: z.array(z.string().url()).max(20).optional(), eventDate: z.string().datetime().optional() });
const recapSchema = z.object({ period: z.enum(['1m', '3m', '6m', '1y']) });

routes.get('/conversations/:id/relationship-timeline', async (c) => {
  const { userId } = c.get('auth'); const conversationId = c.req.param('id');
  let timeline = await getRelationshipTimeline(conversationId, userId);
  if (timeline.memories.length === 0) { await rebuildRelationshipMemoryV2(conversationId, userId); timeline = await getRelationshipTimeline(conversationId, userId); }
  return c.json(timeline, 200);
});

routes.post('/conversations/:id/relationship-memory/rebuild', async (c) => { const { userId } = c.get('auth'); return c.json(await rebuildRelationshipMemoryV2(c.req.param('id'), userId), 200); });

routes.get('/conversations/:id/relationship-recaps', async (c) => { const { userId } = c.get('auth'); return c.json({ recaps: await listRelationshipRecaps(c.req.param('id'), userId) }, 200); });

routes.post('/conversations/:id/relationship-recaps', zValidator('json', recapSchema), async (c) => { const { userId } = c.get('auth'); const { period } = c.req.valid('json'); return c.json(await generateRelationshipRecap(c.req.param('id'), userId, period), 201); });

routes.post('/conversations/:id/relationship-capsules', zValidator('json', capsuleSchema), async (c) => {
  const { userId } = c.get('auth'); const payload = c.req.valid('json');
  if (!payload.body?.trim() && !(payload.mediaUrls?.length)) throw AppError.badRequest('Ajoute une note ou une photo/vidéo à la capsule', 'EMPTY_CAPSULE');
  return c.json(await createRelationshipCapsule({ conversationId: c.req.param('id'), userId, ...payload }), 201);
});

export { routes as relationshipMemoryRoutes };