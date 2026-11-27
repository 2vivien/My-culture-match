import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { requireAdmin } from '../auth/require-admin';
import { adminListPlacesQuerySchema, listPlacesQuerySchema, moderatePlaceSchema, proposePlaceSchema } from './places.schemas';
import { adminListPlaces, deleteMyPlace, listMyPlaces, listPlaces, moderatePlace, proposePlace } from './places.service';

/** /api/places — lecture des lieux publiés, proposition, mes propositions. */
export const placesRoutes = new Hono();
placesRoutes.use('*', requireAuth);

placesRoutes.get('/', zValidator('query', listPlacesQuerySchema), async (c) => {
  const { lat, lon, radiusKm, category } = c.req.valid('query');
  return c.json({ success: true, ...(await listPlaces({ lat, lon, radiusKm, category })) });
});

// Déclaré avant '/:id' pour que « mine » ne soit pas pris pour un identifiant.
placesRoutes.get('/mine', async (c) => {
  const { userId } = c.get('auth');
  return c.json({ success: true, ...(await listMyPlaces(userId)) });
});

placesRoutes.post('/', zValidator('json', proposePlaceSchema), async (c) => {
  const { userId } = c.get('auth');
  return c.json(await proposePlace(userId, c.req.valid('json')), 201);
});

placesRoutes.delete('/:id', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await deleteMyPlace(userId, c.req.param('id')), 200);
});

/** /api/admin/places — file de modération (administrateurs uniquement). */
export const placesAdminRoutes = new Hono();
placesAdminRoutes.use('*', requireAuth);
placesAdminRoutes.use('*', requireAdmin);

placesAdminRoutes.get('/', zValidator('query', adminListPlacesQuerySchema), async (c) => {
  const { status, limit } = c.req.valid('query');
  return c.json({ success: true, ...(await adminListPlaces(status, limit)) });
});

placesAdminRoutes.post('/:id/approve', zValidator('json', moderatePlaceSchema), async (c) => {
  const { userId } = c.get('auth');
  return c.json(await moderatePlace(userId, c.req.param('id'), 'approve'), 200);
});

placesAdminRoutes.post('/:id/reject', zValidator('json', moderatePlaceSchema), async (c) => {
  const { userId } = c.get('auth');
  return c.json(await moderatePlace(userId, c.req.param('id'), 'reject', c.req.valid('json').reason), 200);
});
