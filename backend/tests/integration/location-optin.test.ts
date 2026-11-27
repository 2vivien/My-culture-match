import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app';
import { redis } from '../../src/infrastructure/redis';
import { closeFeedFanoutQueue } from '../../src/modules/feed/feed.queue';
import { closeSearchQueue } from '../../src/modules/search/search.queue';
import { closeEmbeddingQueue } from '../../src/modules/culture-engine/embedding.queue';
import { closeCountersFlushQueue } from '../../src/modules/feed/counters.queue';

const app = createApp();

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function getOtpCode(email: string): Promise<string> {
  const raw = await redis.get(`otp:${email}`);
  if (!raw) throw new Error(`OTP introuvable pour ${email}`);
  return (JSON.parse(raw) as { code: string }).code;
}

async function login(prefix = 'loc'): Promise<string> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.60.${Math.floor(Math.random() * 200)}.1`;
  await app.request('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email }),
  });
  const code = await getOtpCode(email);
  const res = await app.request('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email, code }),
  });
  return ((await res.json()) as { token: string }).token;
}

beforeAll(async () => {
  await redis.flushall();
});

afterAll(async () => {
  await redis.flushall();
  await closeFeedFanoutQueue();
  await closeSearchQueue();
  await closeEmbeddingQueue();
  await closeCountersFlushQueue();
  await redis.quit();
});

const auth = (token: string) => ({ 'content-type': 'application/json', Authorization: `Bearer ${token}` });
const json = async <T>(res: Response) => (await res.json()) as T;

const coords = { latitude: 6.37, longitude: 2.39 };
const patchLocation = (token: string, body: Record<string, unknown>) =>
  app.request('/api/users/me/location', { method: 'PATCH', headers: auth(token), body: JSON.stringify(body) });
const patchSettings = (token: string, body: Record<string, unknown>) =>
  app.request('/api/location/settings', { method: 'PATCH', headers: auth(token), body: JSON.stringify(body) });
const reach = async (token: string) =>
  json<{ count: number; scope: string; openToStrangers: boolean }>(await app.request('/api/location/reach', { headers: auth(token) }));

describe('opt-in de la position', () => {
  it('par défaut : partage désactivé, visibilité limitée aux compagnons, portée nulle', async () => {
    const t = await login();
    const { settings } = await json<{ settings: { sharingEnabled: boolean; visibility: string } }>(await app.request('/api/location/settings', { headers: auth(t) }));
    expect(settings).toMatchObject({ sharingEnabled: false, visibility: 'friends' });
    expect(await reach(t)).toMatchObject({ count: 0, scope: 'none', openToStrangers: false });
  });

  it('envoyer des coordonnées ne suffit pas : le consentement est exigé', async () => {
    const t = await login();
    const res = await patchLocation(t, coords);
    expect(res.status).toBe(400);
    expect((await json<{ error: { code: string } }>(res)).error.code).toBe('LOCATION_CONSENT_REQUIRED');
    const { settings } = await json<{ settings: { sharingEnabled: boolean } }>(await app.request('/api/location/settings', { headers: auth(t) }));
    expect(settings.sharingEnabled).toBe(false);
  });

  it('avec consent: true le partage s’active ; ensuite on met à jour sans le redemander', async () => {
    const t = await login();
    expect((await patchLocation(t, { ...coords, enabled: true, consent: true })).status).toBe(200);
    expect((await patchLocation(t, { latitude: 6.4, longitude: 2.4 })).status).toBe(200);
  });

  it('le réglage sharingEnabled exige aussi le consentement ; le désactiver non', async () => {
    const t = await login();
    expect((await patchSettings(t, { sharingEnabled: true })).status).toBe(400);
    expect((await patchSettings(t, { sharingEnabled: true, consent: true })).status).toBe(200);
    expect((await patchSettings(t, { sharingEnabled: false })).status).toBe(200);
    expect((await patchSettings(t, { sharingEnabled: true })).status).toBe(400);
  });
});

describe('GET /location/reach — « partagé avec N »', () => {
  it('suit la visibilité choisie et retombe à zéro en mode fantôme', async () => {
    const t = await login();
    await patchSettings(t, { sharingEnabled: true, consent: true });
    expect(await reach(t)).toMatchObject({ scope: 'friends', openToStrangers: false });

    await patchSettings(t, { visibility: 'everyone' });
    expect(await reach(t)).toMatchObject({ scope: 'everyone', openToStrangers: true });

    await patchSettings(t, { ghostMode: true });
    expect(await reach(t)).toMatchObject({ count: 0, scope: 'none', openToStrangers: false });
  });
});
