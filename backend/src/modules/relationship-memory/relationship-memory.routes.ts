import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { AppError } from '../../shared/utils/AppError';
import { createRelationshipCapsule, getRelationshipTimeline } from './relationship-memory.service';
import { generateRelationshipRecap, listRelationshipRecaps, rebuildRelationshipMemoryV2 } from './relationship-memory.v2';
import { createSharedMemory, deleteSharedMemory, listSharedMemories, updateSharedMemory } from './shared-memory-box.service';
import { cancelTemporalMessage, listTemporalMessages, scheduleTemporalMessage } from '../temporal-messages/temporal-messages.service';

const routes = new Hono();
routes.use('*', requireAuth);
const capsuleSchema = z.object({ title: z.string().trim().max(160).optional(), body: z.string().trim().max(12_000).optional(), mediaUrls: z.array(z.string().url()).max(20).optional(), eventDate: z.string().datetime().optional() });
const recapSchema = z.object({ period: z.enum(['1m', '3m', '6m', '1y']) });
const memoryKinds = ['note','photo','video','audio','event','place','milestone','conversation','memory','custom'] as const;
const sharedMemorySchema = z.object({ kind: z.enum(memoryKinds).optional(), title: z.string().trim().max(160).optional(), body: z.string().trim().max(12_000).optional(), mediaUrls: z.array(z.string().url()).max(50).optional(), messageIds: z.array(z.string()).max(100).optional(), eventDate: z.string().datetime().optional(), metadata: z.record(z.unknown()).optional() });
const temporalSchema = z.object({
  text: z.string().trim().max(12_000).optional(),
  type: z.enum(['text', 'image', 'voice', 'file']).optional(),
  mediaUrl: z.string().url().optional(),
  audioDur: z.number().int().nonnegative().max(86_400).optional(),
  file: z.record(z.unknown()).optional(),
  revealAt: z.string().datetime(),
}).refine((value) => Boolean(value.text?.trim() || value.mediaUrl || value.file), { message: 'Écris un message ou ajoute un média', path: ['text'] });

routes.get('/conversations/:id/relationship-timeline', async (c) => {
  const { userId } = c.get('auth'); const conversationId = c.req.param('id'); let timeline = await getRelationshipTimeline(conversationId, userId);
  const needsV2 = timeline.memories.length === 0 || timeline.memories.some((m: { source?: string }) => m.source !== 'algorithm-v2');
  if (needsV2) { await rebuildRelationshipMemoryV2(conversationId, userId); timeline = await getRelationshipTimeline(conversationId, userId); }
  return c.json(timeline, 200);
});

routes.post('/conversations/:id/relationship-memory/rebuild', async (c) => { const { userId } = c.get('auth'); return c.json(await rebuildRelationshipMemoryV2(c.req.param('id'), userId), 200); });
routes.get('/conversations/:id/relationship-recaps', async (c) => { const { userId } = c.get('auth'); return c.json({ recaps: await listRelationshipRecaps(c.req.param('id'), userId) }, 200); });
routes.post('/conversations/:id/relationship-recaps', zValidator('json', recapSchema), async (c) => { const { userId } = c.get('auth'); const { period } = c.req.valid('json'); return c.json(await generateRelationshipRecap(c.req.param('id'), userId, period), 201); });
routes.post('/conversations/:id/relationship-capsules', zValidator('json', capsuleSchema), async (c) => { const { userId } = c.get('auth'); const payload = c.req.valid('json'); if (!payload.body?.trim() && !(payload.mediaUrls?.length)) throw AppError.badRequest('Ajoute une note ou une photo/vidéo à la capsule', 'EMPTY_CAPSULE'); return c.json(await createRelationshipCapsule({ conversationId: c.req.param('id'), userId, ...payload }), 201); });

// Shared Memory Box: a private two-person notebook living inside the relationship timeline.
routes.get('/conversations/:id/memory-box', async (c) => {
  const { userId } = c.get('auth');
  return c.json({ memories: await listSharedMemories(c.req.param('id'), userId) }, 200);
});
routes.post('/conversations/:id/memory-box', zValidator('json', sharedMemorySchema), async (c) => {
  const { userId } = c.get('auth');
  return c.json(await createSharedMemory({ conversationId: c.req.param('id'), userId, ...c.req.valid('json') }), 201);
});
routes.patch('/conversations/:id/memory-box/:memoryId', zValidator('json', sharedMemorySchema), async (c) => {
  const { userId } = c.get('auth');
  return c.json(await updateSharedMemory({ conversationId: c.req.param('id'), userId, memoryId: c.req.param('memoryId'), ...c.req.valid('json') }), 200);
});
routes.delete('/conversations/:id/memory-box/:memoryId', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await deleteSharedMemory(c.req.param('id'), userId, c.req.param('memoryId')), 200);
});

// Temporal messages: the recipient can see that something is waiting, never its content before revealAt.
routes.post('/conversations/:id/temporal-messages', zValidator('json', temporalSchema), async (c) => {
  const { userId } = c.get('auth');
  const payload = c.req.valid('json');
  return c.json(await scheduleTemporalMessage({ conversationId: c.req.param('id'), senderId: userId, ...payload, revealAt: new Date(payload.revealAt) }), 201);
});
routes.get('/conversations/:id/temporal-messages', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await listTemporalMessages(c.req.param('id'), userId), 200);
});
routes.delete('/conversations/:id/temporal-messages/:temporalMessageId', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await cancelTemporalMessage(c.req.param('id'), userId, c.req.param('temporalMessageId')), 200);
});

export { routes as relationshipMemoryRoutes };