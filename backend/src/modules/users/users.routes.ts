import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { profilePatchSchema } from './users.schemas';
import { getCurrentUser, getPublicUser, updateProfile, followUser, unfollowUser } from './users.service';

/** Routes /api/users (auth requise). */
export const usersModule = new Hono();

usersModule.use('*', requireAuth);

// GET /api/users/me — profil courant
usersModule.get('/me', async (c) => {
  const { userId } = c.get('auth');
  const user = await getCurrentUser(userId);
  return c.json(user, 200);
});

// PATCH /api/users/me — mise à jour ProfileDetails champ par champ
usersModule.patch('/me', zValidator('json', profilePatchSchema), async (c) => {
  const { userId } = c.get('auth');
  const patch = c.req.valid('json');
  const user = await updateProfile(userId, patch);
  return c.json(user, 200);
});

// GET /api/users/:id — profil public (isFollowing si vu par un utilisateur connecté)
usersModule.get('/:id', async (c) => {
  const userId = c.req.param('id');
  const viewerId = c.get('auth').userId;
  const user = await getPublicUser(userId, viewerId);
  return c.json(user, 200);
});

// POST /api/users/:id/follow — suivre
usersModule.post('/:id/follow', async (c) => {
  const { userId } = c.get('auth');
  const targetId = c.req.param('id');
  const result = await followUser(userId, targetId);
  return c.json(result, 200);
});

// DELETE /api/users/:id/follow — ne plus suivre
usersModule.delete('/:id/follow', async (c) => {
  const { userId } = c.get('auth');
  const targetId = c.req.param('id');
  const result = await unfollowUser(userId, targetId);
  return c.json(result, 200);
});
