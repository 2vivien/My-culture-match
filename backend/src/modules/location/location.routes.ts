import { Hono } from 'hono';
import { requireAuth } from '../auth/require-auth';
import { getLocationSettings, updateLocationSettings, getPeopleNearby } from './location.service';
import { updateLocationHeartbeat } from './location.heartbeat';
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
