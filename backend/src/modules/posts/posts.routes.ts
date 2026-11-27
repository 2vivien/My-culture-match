import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { createPostSchema, createCommentSchema, listCommentsQuerySchema } from './posts.schemas';
import { withIdempotency, idempotencyKeyFrom } from '../../shared/utils/idempotency';
import {
  createPost,
  getPostById,
  toggleLike,
  addComment,
  listComments,
  sharePost,
  toggleSave,
  deletePost,
  listSaves,
} from './posts.service';

/** Routes /api/posts (auth requise). */
export const postsModule = new Hono();

postsModule.use('*', requireAuth);

// POST /api/posts — création (idempotent)
postsModule.post('/', zValidator('json', createPostSchema), async (c) => {
  const { userId } = c.get('auth');
  const input = c.req.valid('json');
  const post = await withIdempotency(`posts:create:${userId}`, idempotencyKeyFrom(c), () =>
    createPost(userId, input),
  );
  return c.json(post, 201);
});

// GET /api/posts/saves/list — posts enregistrés par l'utilisateur
// (déclaré avant '/:id' pour que 'saves' ne soit pas intercepté comme id)
postsModule.get('/saves/list', async (c) => {
  const { userId } = c.get('auth');
  const saves = await listSaves(userId);
  return c.json({ posts: saves }, 200);
});

// GET /api/posts/:id — détail
postsModule.get('/:id', async (c) => {
  const { userId } = c.get('auth');
  const post = await getPostById(c.req.param('id'), userId);
  return c.json(post, 200);
});

// POST /api/posts/:id/like — toggle (idempotent)
postsModule.post('/:id/like', async (c) => {
  const { userId } = c.get('auth');
  const result = await withIdempotency(`posts:like:${userId}`, idempotencyKeyFrom(c), () =>
    toggleLike(userId, c.req.param('id')),
  );
  return c.json(result, 200);
});

// POST /api/posts/:id/comments — ajout (idempotent)
postsModule.post('/:id/comments', zValidator('json', createCommentSchema), async (c) => {
  const { userId } = c.get('auth');
  const input = c.req.valid('json');
  const result = await withIdempotency(
    `posts:comment:${userId}:${c.req.param('id')}`,
    idempotencyKeyFrom(c),
    () => addComment(userId, c.req.param('id'), input),
  );
  return c.json(result, 201);
});

// GET /api/posts/:id/comments — liste (cursor)
postsModule.get('/:id/comments', zValidator('query', listCommentsQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid('query');
  const { userId } = c.get('auth');
  const result = await listComments(c.req.param('id'), cursor, limit, userId);
  return c.json(result, 200);
});

// POST /api/posts/:id/share (idempotent)
postsModule.post('/:id/share', async (c) => {
  const { userId } = c.get('auth');
  const result = await withIdempotency(`posts:share:${userId}`, idempotencyKeyFrom(c), () =>
    sharePost(userId, c.req.param('id')),
  );
  return c.json(result, 200);
});

// POST /api/posts/:id/save — toggle signet
postsModule.post('/:id/save', async (c) => {
  const { userId } = c.get('auth');
  const result = await toggleSave(userId, c.req.param('id'));
  return c.json(result, 200);
});

// DELETE /api/posts/:id/save — retrait signet
postsModule.delete('/:id/save', async (c) => {
  const { userId } = c.get('auth');
  const result = await toggleSave(userId, c.req.param('id'));
  return c.json(result, 200);
});

// DELETE /api/posts/:id — soft delete
postsModule.delete('/:id', async (c) => {
  const { userId } = c.get('auth');
  await deletePost(userId, c.req.param('id'));
  return c.json({ success: true }, 200);
});
