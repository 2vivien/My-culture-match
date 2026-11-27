import { Hono } from 'hono';
import { requireAuth } from '../auth/require-auth';
import { getLocationSettings, updateLocationSettings, getPeopleNearby, getAudience, setAudience } from './location.service';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { updateLocationHeartbeat } from './location.heartbeat';

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

/** Liste de personnes choisies pour le partage de position (modes « sélection » / « tous sauf… »). */
locationRoutes.get('/location/audience', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await getAudience(userId));
});

locationRoutes.put('/location/audience', zValidator('json', z.object({ memberIds: z.array(z.string().min(1)).max(200) }).strict()), async (c) => {
  const { userId } = c.get('auth');
  return c.json(await setAudience(userId, c.req.valid('json').memberIds));
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
