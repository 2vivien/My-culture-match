import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import {
  settingsPatchSchema,
  twoFactorVerifySchema,
  twoFactorDisableSchema,
  emailChangeRequestSchema,
  emailChangeSchema,
} from './settings.schemas';
import {
  getSettings,
  updateSettings,
  startTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  requestEmailChange,
  confirmEmailChange,
} from './settings.service';

function requestContext(c: { req: { header: (n: string) => string | undefined } }) {
  return {
    ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip'),
    userAgent: c.req.header('user-agent'),
  };
}

/** Routes /api/settings (auth requise). */
export const settingsModule = new Hono();

settingsModule.use('*', requireAuth);

// GET /api/settings
settingsModule.get('/', async (c) => {
  const { userId } = c.get('auth');
  const settings = await getSettings(userId);
  return c.json(settings, 200);
});

// PUT /api/settings — rate limit 5/h
settingsModule.put('/', zValidator('json', settingsPatchSchema), async (c) => {
  const { userId } = c.get('auth');
  const patch = c.req.valid('json');
  const settings = await updateSettings(userId, patch);
  return c.json(settings, 200);
});

// POST /api/settings/2fa/start
settingsModule.post('/2fa/start', async (c) => {
  const { userId, email } = c.get('auth');
  const result = await startTwoFactor(userId, email);
  return c.json(result, 200);
});

// POST /api/settings/2fa/verify
settingsModule.post('/2fa/verify', zValidator('json', twoFactorVerifySchema), async (c) => {
  const { userId } = c.get('auth');
  const { code } = c.req.valid('json');
  const settings = await verifyTwoFactor(userId, code, requestContext(c));
  return c.json(settings, 200);
});

// POST /api/settings/2fa/disable
settingsModule.post('/2fa/disable', zValidator('json', twoFactorDisableSchema), async (c) => {
  const { userId } = c.get('auth');
  const { code } = c.req.valid('json');
  const settings = await disableTwoFactor(userId, code, requestContext(c));
  return c.json(settings, 200);
});

// POST /api/settings/email/request
settingsModule.post('/email/request', zValidator('json', emailChangeRequestSchema), async (c) => {
  const { userId } = c.get('auth');
  const { newEmail } = c.req.valid('json');
  const result = await requestEmailChange(userId, newEmail, requestContext(c));
  return c.json(result, 200);
});

// POST /api/settings/email/change
settingsModule.post('/email/change', zValidator('json', emailChangeSchema), async (c) => {
  const { userId } = c.get('auth');
  const { newEmail, code } = c.req.valid('json');
  const settings = await confirmEmailChange(userId, newEmail, code, requestContext(c));
  return c.json(settings, 200);
});
