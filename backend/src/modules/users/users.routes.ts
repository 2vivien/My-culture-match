import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { profilePatchSchema, locationUpdateSchema } from './users.schemas';
import { getCurrentUser, getPublicUser, updateProfile, updateLocation, followUser, unfollowUser } from './users.service';
import { canDiscover, canViewField } from '../consent/consent.service';
import { AppError } from '../../shared/utils/AppError';

export const usersModule = new Hono();
usersModule.use('*', requireAuth);

usersModule.get('/me', async (c) => { const { userId } = c.get('auth'); return c.json(await getCurrentUser(userId), 200); });
usersModule.patch('/me', zValidator('json', profilePatchSchema), async (c) => { const { userId } = c.get('auth'); return c.json(await updateProfile(userId, c.req.valid('json')), 200); });
usersModule.patch('/me/location', zValidator('json', locationUpdateSchema), async (c) => { const { userId } = c.get('auth'); return c.json(await updateLocation(userId, c.req.valid('json')), 200); });

usersModule.get('/:id', async (c) => {
  const targetId = c.req.param('id');
  const viewerId = c.get('auth').userId;
  if (!(await canDiscover(viewerId, targetId))) throw AppError.forbidden('Ce profil n’est pas accessible avec ses préférences de confidentialité', 'PROFILE_DISCOVERY_RESTRICTED');
  const profile = await getPublicUser(targetId, viewerId);
  if (viewerId === targetId) return c.json(profile, 200);
  const safe = { ...(profile as unknown as Record<string, unknown>) };
  if (!(await canViewField(viewerId, targetId, 'country'))) { delete safe.country; delete safe.region; }
  if (!(await canViewField(viewerId, targetId, 'photos'))) { delete safe.photos; delete safe.media; delete safe.mediaUrls; delete safe.gallery; }
  return c.json(safe, 200);
});

usersModule.post('/:id/follow', async (c) => { const { userId } = c.get('auth'); return c.json(await followUser(userId, c.req.param('id')), 200); });
usersModule.delete('/:id/follow', async (c) => { const { userId } = c.get('auth'); return c.json(await unfollowUser(userId, c.req.param('id')), 200); });
