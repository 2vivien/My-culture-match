import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import {
  createTribeSchema,
  patchTribeSchema,
  listTribesQuerySchema,
  sanctionSchema,
  tribePostsQuerySchema,
  voteSchema,
  promoteModeratorSchema,
  reportSchema,
  createRuleSchema,
  patchRuleSchema,
} from './tribes.schemas';
import { sanctionMember, liftSanction, listSanctions } from './tribes.sanctions.service';
import {
  listTribes,
  listMyTribes,
  createTribe,
  getTribeDetail,
  patchTribe,
  deleteTribe,
  joinTribe,
  leaveTribe,
  tribePosts,
  votePost,
  pinTribePost,
  promoteModerator,
  demoteModerator,
  addTribeRule,
  updateTribeRule,
  deleteTribeRule,
  reportTribe,
  reportTribePost,
  listTribeReports,
} from './tribes.service';
import { createPost } from '../posts/posts.service';
import { createPostSchema } from '../posts/posts.schemas';
import { redis } from '../../infrastructure/redis';
import { tribeVisitorsKey } from './tribes.service';
import { tribeVisitorsDirtyKey } from '../feed/counters';

/** Routes /api/tribes + /api/tribu (votes). */
export const tribesModule = new Hono();
export const tribuModule = new Hono();

tribesModule.use('*', requireAuth);

// GET /api/tribes
tribesModule.get('/', zValidator('query', listTribesQuerySchema), async (c) => {
  const { search, cursor, limit } = c.req.valid('query');
  const result = await listTribes(search, cursor, limit);
  return c.json(result, 200);
});

// GET /api/tribes/mine — tribus de l'utilisateur courant (sidebar "Your Own Tribes")
// Déclaré avant '/:id' pour que 'mine' ne soit pas intercepté comme id.
tribesModule.get('/mine', async (c) => {
  const { userId } = c.get('auth');
  const tribes = await listMyTribes(userId);
  return c.json({ tribes }, 200);
});

// POST /api/tribes
tribesModule.post('/', zValidator('json', createTribeSchema), async (c) => {
  const { userId } = c.get('auth');
  const input = c.req.valid('json');
  const tribe = await createTribe(userId, input);
  return c.json(tribe, 201);
});

// GET /api/tribes/:id — détail (incrémente visitors)
tribesModule.get('/:id', async (c) => {
  const { userId } = c.get('auth');
  const tribeId = c.req.param('id');
  await redis.incr(tribeVisitorsKey(tribeId));
  await redis.zadd(tribeVisitorsDirtyKey, Date.now(), tribeId);
  const tribe = await getTribeDetail(tribeId, userId);
  return c.json(tribe, 200);
});

// PATCH /api/tribes/:id
tribesModule.patch('/:id', zValidator('json', patchTribeSchema), async (c) => {
  const { userId } = c.get('auth');
  const patch = c.req.valid('json');
  const tribe = await patchTribe(c.req.param('id'), userId, patch);
  return c.json(tribe, 200);
});

// DELETE /api/tribes/:id
tribesModule.delete('/:id', async (c) => {
  const { userId } = c.get('auth');
  await deleteTribe(c.req.param('id'), userId);
  return c.json({ success: true }, 200);
});

// POST /api/tribes/:id/join
tribesModule.post('/:id/join', async (c) => {
  const { userId } = c.get('auth');
  const result = await joinTribe(c.req.param('id'), userId);
  return c.json(result, 200);
});

// DELETE /api/tribes/:id/leave
tribesModule.delete('/:id/leave', async (c) => {
  const { userId } = c.get('auth');
  const result = await leaveTribe(c.req.param('id'), userId);
  return c.json(result, 200);
});

// GET /api/tribes/:id/posts
tribesModule.get('/:id/posts', zValidator('query', tribePostsQuerySchema), async (c) => {
  const { userId } = c.get('auth');
  const { cursor, limit, sort, t } = c.req.valid('query');
  const result = await tribePosts(c.req.param('id'), userId, cursor, limit, sort, t);
  return c.json(result, 200);
});

// GET /api/tribes/:id/rules
tribesModule.get('/:id/rules', async (c) => {
  const { userId } = c.get('auth');
  const tribe = await getTribeDetail(c.req.param('id'), userId);
  return c.json({ rules: tribe.rules }, 200);
});

// GET /api/tribes/:id/moderators
tribesModule.get('/:id/moderators', async (c) => {
  const { userId } = c.get('auth');
  const tribe = await getTribeDetail(c.req.param('id'), userId);
  return c.json({ moderators: tribe.moderators }, 200);
});

// POST /api/tribes/:id/posts — poster dans la tribu
tribesModule.post('/:id/posts', zValidator('json', createPostSchema), async (c) => {
  const { userId } = c.get('auth');
  const tribeId = c.req.param('id');
  const input = c.req.valid('json');
  const post = await createPost(userId, { ...input, tribeId });
  return c.json(post, 201);
});

// POST /api/tribes/:id/posts/:postId/pin — pin/unpin (moderator+)
tribesModule.post('/:id/posts/:postId/pin', async (c) => {
  const { userId } = c.get('auth');
  const result = await pinTribePost(c.req.param('id'), c.req.param('postId'), userId, true);
  return c.json(result, 200);
});
tribesModule.delete('/:id/posts/:postId/pin', async (c) => {
  const { userId } = c.get('auth');
  const result = await pinTribePost(c.req.param('id'), c.req.param('postId'), userId, false);
  return c.json(result, 200);
});

// POST /api/tribes/:id/moderators — promotion (owner)
tribesModule.post('/:id/moderators', zValidator('json', promoteModeratorSchema), async (c) => {
  const { userId } = c.get('auth');
  const { userId: targetUserId } = c.req.valid('json');
  const result = await promoteModerator(c.req.param('id'), userId, targetUserId);
  return c.json(result, 200);
});

// DELETE /api/tribes/:id/moderators/:userId — rétrogradation (owner)
tribesModule.delete('/:id/moderators/:userId', async (c) => {
  const { userId } = c.get('auth');
  const result = await demoteModerator(c.req.param('id'), userId, c.req.param('userId'));
  return c.json(result, 200);
});

// POST /api/tribes/:id/rules — ajout d'une règle (owner)
tribesModule.post('/:id/rules', zValidator('json', createRuleSchema), async (c) => {
  const { userId } = c.get('auth');
  const input = c.req.valid('json');
  const rule = await addTribeRule(c.req.param('id'), userId, input);
  return c.json(rule, 201);
});

// PATCH /api/tribes/:id/rules/:ruleId — modification (owner)
tribesModule.patch('/:id/rules/:ruleId', zValidator('json', patchRuleSchema), async (c) => {
  const { userId } = c.get('auth');
  const input = c.req.valid('json');
  const rule = await updateTribeRule(c.req.param('id'), userId, c.req.param('ruleId'), input);
  return c.json(rule, 200);
});

// DELETE /api/tribes/:id/rules/:ruleId — suppression (owner)
tribesModule.delete('/:id/rules/:ruleId', async (c) => {
  const { userId } = c.get('auth');
  const result = await deleteTribeRule(c.req.param('id'), userId, c.req.param('ruleId'));
  return c.json(result, 200);
});

// POST /api/tribes/:id/report — signaler une tribu
tribesModule.post('/:id/report', zValidator('json', reportSchema), async (c) => {
  const { userId } = c.get('auth');
  const { reason } = c.req.valid('json');
  const result = await reportTribe(c.req.param('id'), userId, reason);
  return c.json(result, 200);
});

// POST /api/tribes/:id/posts/:postId/report — signaler un post de tribu
tribesModule.post('/:id/posts/:postId/report', zValidator('json', reportSchema), async (c) => {
  const { userId } = c.get('auth');
  const { reason } = c.req.valid('json');
  const result = await reportTribePost(c.req.param('id'), c.req.param('postId'), userId, reason);
  return c.json(result, 200);
});

// GET /api/tribes/:id/reports — signalements ouverts (moderator+)
tribesModule.get('/:id/reports', zValidator('query', listTribesQuerySchema), async (c) => {
  const { userId } = c.get('auth');
  const { cursor, limit } = c.req.valid('query');
  const result = await listTribeReports(c.req.param('id'), userId, cursor, limit);
  return c.json(result, 200);
});

// Sanctions de tribu (modérateur+)
tribesModule.get('/:id/sanctions', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await listSanctions(c.req.param('id'), userId), 200);
});
tribesModule.post('/:id/sanctions', zValidator('json', sanctionSchema), async (c) => {
  const { userId } = c.get('auth');
  return c.json(await sanctionMember(c.req.param('id'), userId, c.req.valid('json')), 201);
});
tribesModule.delete('/:id/sanctions/:userId', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await liftSanction(c.req.param('id'), userId, c.req.param('userId')), 200);
});

// POST /api/tribu/posts/:id/upvote — toggle upvote/downvote
tribuModule.use('*', requireAuth);
tribuModule.post('/posts/:id/upvote', zValidator('json', voteSchema), async (c) => {
  const { userId } = c.get('auth');
  const { value } = c.req.valid('json');
  const result = await votePost(c.req.param('id'), userId, value);
  return c.json(result, 200);
});
