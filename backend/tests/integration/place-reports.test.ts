import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../src/infrastructure/database';
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

async function login(prefix = 'prp'): Promise<string> {
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
const meId = async (token: string) => (await json<{ id: string }>(await app.request('/api/users/me', { headers: auth(token) }))).id;

const here = { latitude: 6.3703, longitude: 2.4325 };

async function adminToken(): Promise<string> {
  const t = await login();
  const id = await meId(t);
  await db.update(schema.users).set({ role: 'admin' }).where(eq(schema.users.id, id));
  await redis.del(`role:${id}`);
  return t;
}

async function publishedPlace(admin: string, proposer: string): Promise<string> {
  const res = await app.request('/api/places', { method: 'POST', headers: auth(proposer), body: JSON.stringify({ name: `Lieu ${unique()}`, category: 'marche', ...here }) });
  expect(res.status).toBe(201);
  const { id } = await json<{ id: string }>(res);
  expect((await app.request(`/api/admin/places/${id}/approve`, { method: 'POST', headers: auth(admin), body: '{}' })).status).toBe(200);
  return id;
}

const report = (token: string, targetId: string, reason = 'other') =>
  app.request('/api/reports', { method: 'POST', headers: auth(token), body: JSON.stringify({ targetType: 'place', targetId, reason, description: 'adresse_privee' }) });
const visibleIds = async (token: string) =>
  (await json<{ places: Array<{ id: string }> }>(await app.request(`/api/places?lat=${here.latitude}&lon=${here.longitude}&radiusKm=10`, { headers: auth(token) }))).places.map((p) => p.id);

describe('signalement des lieux culturels', () => {
  it('on signale un lieu publié ; un lieu en attente répond « introuvable »', async () => {
    const admin = await adminToken();
    const author = await login();
    const reporter = await login();
    const placeId = await publishedPlace(admin, author);
    expect((await report(reporter, placeId)).status).toBe(201);

    const pending = await json<{ id: string }>(await app.request('/api/places', { method: 'POST', headers: auth(author), body: JSON.stringify({ name: `Attente ${unique()}`, category: 'marche', ...here, latitude: here.latitude + 0.3 }) }));
    expect((await report(reporter, pending.id)).status).toBe(404);
  });

  it('un même lecteur ne peut pas signaler deux fois le même lieu', async () => {
    const admin = await adminToken();
    const author = await login();
    const reporter = await login();
    const placeId = await publishedPlace(admin, author);
    expect((await report(reporter, placeId)).status).toBe(201);
    expect((await report(reporter, placeId)).status).toBe(409);
  });

  it('trois signalements de personnes distinctes masquent le lieu en attendant la modération', async () => {
    const admin = await adminToken();
    const author = await login();
    const viewer = await login();
    const placeId = await publishedPlace(admin, author);
    expect(await visibleIds(viewer)).toContain(placeId);

    for (let i = 0; i < 2; i += 1) expect((await report(await login(), placeId)).status).toBe(201);
    expect(await visibleIds(viewer)).toContain(placeId);

    expect((await report(await login(), placeId)).status).toBe(201);
    expect(await visibleIds(viewer)).not.toContain(placeId);
  });

  it('classer les signalements (« dismiss ») refait apparaître un lieu légitime', async () => {
    const admin = await adminToken();
    const author = await login();
    const viewer = await login();
    const placeId = await publishedPlace(admin, author);
    const ids: string[] = [];
    for (let i = 0; i < 3; i += 1) ids.push((await json<{ id: string }>(await report(await login(), placeId))).id);
    expect(await visibleIds(viewer)).not.toContain(placeId);

    for (const id of ids) {
      expect((await app.request(`/api/admin/reports/${id}/action`, { method: 'POST', headers: auth(admin), body: JSON.stringify({ action: 'dismiss', reason: 'Lieu légitime' }) })).status).toBe(200);
    }
    expect(await visibleIds(viewer)).toContain(placeId);
  });

  it('retirer le lieu traite les signalements ouverts à son sujet', async () => {
    const admin = await adminToken();
    const author = await login();
    const reporter = await login();
    const placeId = await publishedPlace(admin, author);
    const reportId = (await json<{ id: string }>(await report(reporter, placeId))).id;

    expect((await app.request(`/api/admin/places/${placeId}/reject`, { method: 'POST', headers: auth(admin), body: JSON.stringify({ reason: 'Adresse privée' }) })).status).toBe(200);
    const list = await json<{ reports: Array<{ id: string; status: string; resolution: string | null }> }>(await app.request('/api/admin/reports?status=actioned&limit=50', { headers: auth(admin) }));
    expect(list.reports.find((r) => r.id === reportId)).toMatchObject({ status: 'actioned' });
  });

  it('la modération peut avertir l’auteur du lieu depuis un signalement', async () => {
    const admin = await adminToken();
    const author = await login();
    const reporter = await login();
    const placeId = await publishedPlace(admin, author);
    const reportId = (await json<{ id: string }>(await report(reporter, placeId))).id;
    const res = await app.request(`/api/admin/reports/${reportId}/action`, { method: 'POST', headers: auth(admin), body: JSON.stringify({ action: 'warn', reason: 'Évite les adresses privées' }) });
    expect(res.status).toBe(200);
  });

  it('un événement public d’un lieu masqué disparaît aussi', async () => {
    const admin = await adminToken();
    const author = await login();
    const viewer = await login();
    const placeId = await publishedPlace(admin, author);
    const startsAt = new Date(Date.now() + 24 * 3600_000).toISOString();
    const ev = await app.request('/api/events', { method: 'POST', headers: auth(author), body: JSON.stringify({ title: `Fête ${unique()}`, startsAt, visibility: 'public', placeId }) });
    expect(ev.status).toBe(201);
    const eventId = (await json<{ id: string }>(ev)).id;
    expect((await app.request(`/api/events/${eventId}`, { headers: auth(viewer) })).status).toBe(200);

    for (let i = 0; i < 3; i += 1) await report(await login(), placeId);
    expect((await app.request(`/api/events/${eventId}`, { headers: auth(viewer) })).status).toBe(404);
  });
});
