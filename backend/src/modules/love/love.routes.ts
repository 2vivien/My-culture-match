import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { swipeSchema, loveSearchSchema } from './love.schemas';
import { withIdempotency, idempotencyKeyFrom } from '../../shared/utils/idempotency';
import { getLoveCandidates, getLoveCandidate, getActiveLoveMatches, swipe, searchLove, getLoveSearchQuota, getIncomingLoveRequests, acceptLoveRequest, declineLoveRequest } from './love.service';
import { handleLoveConversation, loveConversationSchema } from './love.conversation';

const loveRoutes = new Hono();
loveRoutes.use('*', requireAuth);

loveRoutes.get('/love/matches', async (c) => { const { userId } = c.get('auth'); const { candidates } = await getLoveCandidates(userId); return c.json(candidates, 200); });
loveRoutes.get('/love/active', async (c) => { const { userId } = c.get('auth'); const { candidates } = await getActiveLoveMatches(userId); return c.json(candidates, 200); });
loveRoutes.get('/love/matches/:id', async (c) => { const { userId } = c.get('auth'); const { candidate } = await getLoveCandidate(userId, c.req.param('id')); return c.json(candidate, 200); });

loveRoutes.post('/love/search', zValidator('json', loveSearchSchema), async (c) => {
  const { userId } = c.get('auth');
  const { query } = c.req.valid('json');
  return c.json(await searchLove(userId, query), 200);
});

loveRoutes.post('/love/conversation', zValidator('json', loveConversationSchema), async (c) => {
  const { userId } = c.get('auth');
  const { messages } = c.req.valid('json');
  return c.json(await handleLoveConversation(userId, messages), 200);
});

loveRoutes.get('/love/search/quota', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await getLoveSearchQuota(userId), 200);
});

loveRoutes.post('/love/swipe', zValidator('json', swipeSchema), async (c) => {
  const { userId: candidateId, action } = c.req.valid('json');
  const { userId } = c.get('auth');
  const result = await withIdempotency(`love:swipe:${userId}:${candidateId}`, idempotencyKeyFrom(c), () => swipe(userId, candidateId, action));
  return c.json(result, 200);
});

/** Requêtes Love reçues (type Tinder) : l'autre personne doit accepter avant toute conversation. */
loveRoutes.get('/love/requests', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await getIncomingLoveRequests(userId), 200);
});

loveRoutes.post('/love/requests/:userId/accept', async (c) => {
  const { userId } = c.get('auth');
  const fromId = c.req.param('userId');
  return c.json(await withIdempotency(`love:accept:${userId}:${fromId}`, idempotencyKeyFrom(c), () => acceptLoveRequest(userId, fromId)), 200);
});

loveRoutes.post('/love/requests/:userId/decline', async (c) => {
  const { userId } = c.get('auth');
  const fromId = c.req.param('userId');
  return c.json(await withIdempotency(`love:decline:${userId}:${fromId}`, idempotencyKeyFrom(c), () => declineLoveRequest(userId, fromId)), 200);
});

export { loveRoutes };
