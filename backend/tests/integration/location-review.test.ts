import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../src/infrastructure/database';
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

async function login(prefix = 'lrev'): Promise<string> {
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
const getSettings = async (token: string) =>
  (await json<{ settings: Record<string, unknown> }>(await app.request('/api/location/settings', { headers: auth(token) }))).settings;

describe('C1 - GET /api/connections/nearby supprimée', () => {
  it('ne renvoie plus de coordonnées brutes d’inconnus : la route n’existe plus', async () => {
    const token = await login();
    const res = await app.request('/api/connections/nearby', { headers: auth(token) });
    expect(res.status).toBe(404);
  });
});

describe('E5 - défaut de visibilité « friends »', () => {
  it('activer le partage via PATCH /users/me/location crée des réglages en « friends », pas « nearby »', async () => {
    const token = await login();
    const res = await patchLocation(token, { ...coords, enabled: true, consent: true });
    expect(res.status).toBe(200);
    const settings = await getSettings(token);
    expect(settings.sharingEnabled).toBe(true);
    expect(settings.visibility).toBe('friends');
  });
});

describe('M1 - couper le partage purge tout, et réactiver n’invente pas de position fraîche', () => {
  it('PATCH /users/me/location {enabled:false} purge latitude/longitude et la réactivation ne les ressuscite pas', async () => {
    const token = await login();
    await patchLocation(token, { ...coords, enabled: true, consent: true });
    const off = await json<{ latitude: number | null; longitude: number | null; locationSharingEnabled: boolean }>(await patchLocation(token, { enabled: false }));
    expect(off).toMatchObject({ latitude: null, longitude: null, locationSharingEnabled: false });
    expect((await getSettings(token)).sharingEnabled).toBe(false); // cache invalidé
    // Réactivation par les réglages : aucune ancienne coordonnée ne revient.
    const on = await patchSettings(token, { sharingEnabled: true, consent: true });
    expect(on.status).toBe(200);
    const nearby = await json<{ people: unknown[] }>(await app.request('/api/location/nearby', { headers: auth(token) }));
    expect(nearby.people).toEqual([]);
  });
  it('PATCH /location/settings {sharingEnabled:false} efface aussi le lieu des stories et les coordonnées en base', async () => {
    const token = await login();
    await patchLocation(token, { ...coords, enabled: true, consent: true });
    const created = await app.request('/api/stories', { method: 'POST', headers: auth(token), body: JSON.stringify({ mediaUrl: 'https://example.com/a.jpg', type: 'image', place: { ...coords, label: 'Cotonou' } }) });
    expect(created.status).toBe(201);
    const { id } = await json<{ id: string }>(created);
    const [before] = await db.select({ lat: schema.stories.placeLat }).from(schema.stories).where(eq(schema.stories.id, id));
    expect(before?.lat).not.toBeNull();

    expect((await patchSettings(token, { sharingEnabled: false })).status).toBe(200);
    const [after] = await db.select({ lat: schema.stories.placeLat, lon: schema.stories.placeLon, label: schema.stories.placeLabel }).from(schema.stories).where(eq(schema.stories.id, id));
    expect(after).toEqual({ lat: null, lon: null, label: null });
    const [user] = await db.select({ lat: schema.users.latitude, lon: schema.users.longitude, at: schema.users.locationUpdatedAt }).from(schema.users)
      .innerJoin(schema.stories, eq(schema.stories.userId, schema.users.id)).where(eq(schema.stories.id, id));
    expect(user).toEqual({ lat: null, lon: null, at: null });
  });
});
