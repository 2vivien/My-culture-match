import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { createPostSchema, createCommentSchema, listCommentsQuerySchema } from './posts.schemas';
import {
  createPost,
  getPostById,
  toggleLike,
  addComment,
  listComments,
  sharePost,
  toggleSave,
  deletePost,
} from './posts.service';

/** Routes /api/posts (auth requise). */
export const postsModule = new Hono();

postsModule.use('*', requireAuth);

// POST /api/posts — création
postsModule.post('/', zValidator('json', createPostSchema), async (c) => {
  const { userId } = c.get('auth');
  const input = c.req.valid('json');
  const post = await createPost(userId, input);
  return c.json(post, 201);
});

// GET /api/posts/:id — détail
postsModule.get('/:id', async (c) => {
  const { userId } = c.get('auth');
  const post = await getPostById(c.req.param('id'), userId);
  return c.json(post, 200);
});

// POST /api/posts/:id/like — toggle
postsModule.post('/:id/like', async (c) => {
  const { userId } = c.get('auth');
  const result = await toggleLike(userId, c.req.param('id'));
  return c.json(result, 200);
});

// POST /api/posts/:id/comments — ajout
postsModule.post('/:id/comments', zValidator('json', createCommentSchema), async (c) => {
  const { userId } = c.get('auth');
  const input = c.req.valid('json');
  const result = await addComment(userId, c.req.param('id'), input);
  return c.json(result, 201);
});

// GET /api/posts/:id/comments — liste (cursor)
postsModule.get('/:id/comments', zValidator('query', listCommentsQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid('query');
  const result = await listComments(c.req.param('id'), cursor, limit);
  return c.json(result, 200);
});

// POST /api/posts/:id/share
postsModule.post('/:id/share', async (c) => {
  const { userId } = c.get('auth');
  const result = await sharePost(userId, c.req.param('id'));
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
