import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { profilePatchSchema, locationUpdateSchema } from './users.schemas';
import { getCurrentUser, getPublicUser, updateProfile, updateLocation, followUser, unfollowUser } from './users.service';
import { getKarma } from './users.karma';
import { canDiscover, canViewField } from '../consent/consent.service';
import { AppError } from '../../shared/utils/AppError';
import { rateLimitHit } from '../../shared/utils/rate-limit';
import { exportUserData, deleteAccount } from './account.service';
import { DELETE_CONFIRMATION, isDeleteConfirmed } from './account.export';

export const usersModule = new Hono();
usersModule.use('*', requireAuth);

usersModule.get('/me', async (c) => { const { userId } = c.get('auth'); return c.json(await getCurrentUser(userId), 200); });
usersModule.patch('/me', zValidator('json', profilePatchSchema), async (c) => { const { userId } = c.get('auth'); return c.json(await updateProfile(userId, c.req.valid('json')), 200); });
usersModule.patch('/me/location', zValidator('json', locationUpdateSchema), async (c) => { const { userId } = c.get('auth'); return c.json(await updateLocation(userId, c.req.valid('json')), 200); });

/** Export des données personnelles (droit d'accès) — 3 exports par heure. */
usersModule.get('/me/export', async (c) => {
  const { userId } = c.get('auth');
  const rate = await rateLimitHit(`export:${userId}`, 3, 3600);
  if (!rate.allowed) throw AppError.tooMany('Trop d’exports, réessaie plus tard', 'RATE_LIMITED');
  c.header('Content-Disposition', 'attachment; filename="my-culture-match-export.json"');
  return c.json(await exportUserData(userId), 200);
});

/** Suppression définitive du compte : exige la phrase de confirmation (action irréversible). */
usersModule.delete('/me', async (c) => {
  const { userId } = c.get('auth');
  const body = await c.req.json().catch(() => ({})) as { confirm?: unknown };
  if (!isDeleteConfirmed(body.confirm)) {
    throw AppError.badRequest(`Pour confirmer, envoie confirm: « ${DELETE_CONFIRMATION} »`, 'DELETE_CONFIRMATION_REQUIRED');
  }
  const rate = await rateLimitHit(`delete-account:${userId}`, 3, 3600);
  if (!rate.allowed) throw AppError.tooMany('Trop de tentatives, réessaie plus tard', 'RATE_LIMITED');
  return c.json(await deleteAccount(userId), 200);
});

usersModule.get('/me/karma', async (c) => { const { userId } = c.get('auth'); return c.json(await getKarma(userId), 200); });

// Karma public d'un profil : même contrôle d'accès que le profil lui-même.
usersModule.get('/:id/karma', async (c) => {
  const targetId = c.req.param('id');
  const viewerId = c.get('auth').userId;
  if (viewerId !== targetId && !(await canDiscover(viewerId, targetId))) throw AppError.forbidden('Ce profil n’est pas accessible avec ses préférences de confidentialité', 'PROFILE_DISCOVERY_FORBIDDEN');
  return c.json(await getKarma(targetId), 200);
});

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
