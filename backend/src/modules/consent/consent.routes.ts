import { Hono } from 'hono';
import { requireAuth } from '../auth/require-auth';
import { getConsentSettings, updateConsentSettings } from './consent.service';

const consentRoutes = new Hono();
consentRoutes.use('*', requireAuth);

consentRoutes.get('/consent/settings', async (c) => {
  const { userId } = c.get('auth');
  return c.json({ success: true, settings: await getConsentSettings(userId) });
});

consentRoutes.patch('/consent/settings', async (c) => {
  const { userId } = c.get('auth');
  const body = await c.req.json();
  return c.json({ success: true, settings: await updateConsentSettings(userId, body) });
});

export { consentRoutes };
