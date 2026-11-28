import { Hono } from 'hono';
import { requireAuth } from '../auth/require-auth';
import { getLocationSettings, updateLocationSettings, getPeopleNearby, getAudience, setAudience, getReach, getNearbyNotify, setNearbyNotify } from './location.service';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { updateLocationHeartbeat } from './location.heartbeat';
import { getMapStories } from '../stories/stories.map.service';
import { mapStoriesQuerySchema } from '../stories/stories.schemas';
import { geocode } from './geocode.service';

const locationRoutes = new Hono();
locationRoutes.use('*', requireAuth);

locationRoutes.get('/location/settings', async (c) => {
  const { userId } = c.get('auth');
  return c.json({ success: true, settings: await getLocationSettings(userId) });
});

locationRoutes.patch('/location/settings', async (c) => {
  const { userId } = c.get('auth');
  const body = await c.req.json();
  return c.json({ success: true, settings: await updateLocationSettings(userId, body) });
});

/** Opt-in « quelqu'un est près de toi » (désactivé par défaut). Booléen explicite requis. */
locationRoutes.get('/location/nearby-notify', async (c) => {
  const { userId } = c.get('auth');
  return c.json({ success: true, ...(await getNearbyNotify(userId)) });
});

locationRoutes.patch('/location/nearby-notify', zValidator('json', z.object({ enabled: z.boolean() }).strict()), async (c) => {
  const { userId } = c.get('auth');
  return c.json({ success: true, ...(await setNearbyNotify(userId, c.req.valid('json').enabled)) });
});

/** « Partagé avec N » : combien de personnes peuvent voir ma position en ce moment. */
locationRoutes.get('/location/reach', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await getReach(userId));
});

/** Liste de personnes choisies pour le partage de position (modes « sélection » / « tous sauf… »). */
locationRoutes.get('/location/audience', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await getAudience(userId));
});

locationRoutes.put('/location/audience', zValidator('json', z.object({ memberIds: z.array(z.string().min(1)).max(200) }).strict()), async (c) => {
  const { userId } = c.get('auth');
  return c.json(await setAudience(userId, c.req.valid('json').memberIds));
});

/** Stories posées sur la carte et visibles par le lecteur (mêmes règles que People Nearby). */
locationRoutes.get('/location/stories', zValidator('query', mapStoriesQuerySchema), async (c) => {
  const { userId } = c.get('auth');
  const { lat, lon } = c.req.valid('query');
  const origin = lat !== undefined && lon !== undefined ? { latitude: lat, longitude: lon } : undefined;
  return c.json({ success: true, ...(await getMapStories(userId, origin)) });
});

/** Recherche de lieu (proxy de géocodage, cache + limite de débit). */
locationRoutes.get('/location/geocode', async (c) => {
  const { userId } = c.get('auth');
  return c.json({ results: await geocode(userId, c.req.query('q') ?? '') });
});

locationRoutes.post('/location/heartbeat', async (c) => {
  const { userId } = c.get('auth');
  const body = await c.req.json() as { latitude?: number; longitude?: number };
  if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
    return c.json({ error: { code: 'INVALID_COORDINATES', message: 'latitude et longitude sont requises' } }, 400);
  }
  return c.json(await updateLocationHeartbeat(userId, body.latitude, body.longitude));
});

locationRoutes.get('/location/nearby', async (c) => {
  const { userId } = c.get('auth');
  const lat = Number(c.req.query('lat'));
  const lon = Number(c.req.query('lon'));
  const viewerLocation = Number.isFinite(lat) && Number.isFinite(lon) ? { latitude: lat, longitude: lon } : undefined;
  return c.json({ success: true, ...(await getPeopleNearby(userId, viewerLocation)) });
});

export { locationRoutes };
