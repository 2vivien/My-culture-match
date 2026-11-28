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
