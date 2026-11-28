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

async function login(prefix = 'plc'): Promise<string> {
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

async function adminToken(): Promise<string> {
  const t = await login();
  await db.update(schema.users).set({ role: 'admin' }).where(eq(schema.users.id, await meId(t)));
  await redis.del(`role:${await meId(t)}`);
  return t;
}

const base = { category: 'marche', latitude: 6.3703, longitude: 2.4325 };
const propose = (token: string, over: Record<string, unknown> = {}) =>
  app.request('/api/places', { method: 'POST', headers: auth(token), body: JSON.stringify({ name: `Marché ${unique()}`, ...base, ...over }) });
const nearby = async (token: string, query = '') =>
  (await json<{ places: Array<{ id: string; createdBy?: unknown; createdById?: unknown }> }>(
    await app.request(`/api/places?lat=${base.latitude}&lon=${base.longitude}&radiusKm=10${query}`, { headers: auth(token) }),
  )).places;

describe('lieux culturels — proposition et modération', () => {
  it('une proposition est toujours « en attente » et invisible du public tant qu’elle n’est pas approuvée', async () => {
    const author = await login();
    const stranger = await login();
    const res = await propose(author);
    expect(res.status).toBe(201);
    const place = await json<{ id: string; status: string }>(res);
    expect(place.status).toBe('pending');
    expect((await nearby(stranger)).map((p) => p.id)).not.toContain(place.id);
    expect((await nearby(author)).map((p) => p.id)).not.toContain(place.id);
  });

  it('refuse de fixer soi-même le statut, une catégorie inconnue ou des coordonnées invalides', async () => {
    const t = await login();
    expect((await propose(t, { status: 'published' })).status).toBe(400);
    expect((await propose(t, { category: 'domicile' })).status).toBe(400);
    expect((await propose(t, { latitude: 120 })).status).toBe(400);
  });

  it('un non-administrateur ne peut pas modérer', async () => {
    const author = await login();
    const place = await json<{ id: string }>(await propose(author));
    const res = await app.request(`/api/admin/places/${place.id}/approve`, { method: 'POST', headers: auth(author), body: '{}' });
    expect(res.status).toBe(403);
    expect((await app.request('/api/admin/places', { headers: auth(author) })).status).toBe(403);
  });

  it('l’administrateur approuve : le lieu devient visible, sans révéler son auteur', async () => {
    const admin = await adminToken();
    const author = await login();
    const stranger = await login();
    const place = await json<{ id: string }>(await propose(author));

    const queue = await json<{ places: Array<{ id: string; createdBy: { id: string } }> }>(await app.request('/api/admin/places?status=pending', { headers: auth(admin) }));
    expect(queue.places.map((p) => p.id)).toContain(place.id);

    expect((await app.request(`/api/admin/places/${place.id}/approve`, { method: 'POST', headers: auth(admin), body: '{}' })).status).toBe(200);
    const visible = await nearby(stranger);
    const found = visible.find((p) => p.id === place.id);
    expect(found).toBeDefined();
    expect(found).not.toHaveProperty('createdBy');
    expect(found).not.toHaveProperty('createdById');
    // Rejouer la même décision est refusé.
    expect((await app.request(`/api/admin/places/${place.id}/approve`, { method: 'POST', headers: auth(admin), body: '{}' })).status).toBe(409);
  });

  it('un refus exige une raison, que le proposant retrouve dans « mes lieux »', async () => {
    const admin = await adminToken();
    const author = await login();
    const place = await json<{ id: string }>(await propose(author));

    expect((await app.request(`/api/admin/places/${place.id}/reject`, { method: 'POST', headers: auth(admin), body: '{}' })).status).toBe(400);
    expect((await app.request(`/api/admin/places/${place.id}/reject`, { method: 'POST', headers: auth(admin), body: JSON.stringify({ reason: 'Adresse privée' }) })).status).toBe(200);

    const mine = await json<{ places: Array<{ id: string; status: string; rejectionReason: string | null }> }>(await app.request('/api/places/mine', { headers: auth(author) }));
    expect(mine.places.find((p) => p.id === place.id)).toMatchObject({ status: 'rejected', rejectionReason: 'Adresse privée' });
    expect((await nearby(author)).map((p) => p.id)).not.toContain(place.id);
  });

  it('un lieu publié peut être retiré par la modération', async () => {
    const admin = await adminToken();
    const author = await login();
    const place = await json<{ id: string }>(await propose(author));
    await app.request(`/api/admin/places/${place.id}/approve`, { method: 'POST', headers: auth(admin), body: '{}' });
    expect((await nearby(author)).map((p) => p.id)).toContain(place.id);
    await app.request(`/api/admin/places/${place.id}/reject`, { method: 'POST', headers: auth(admin), body: JSON.stringify({ reason: 'Signalé par la communauté' }) });
    expect((await nearby(author)).map((p) => p.id)).not.toContain(place.id);
  });

  it('refuse un doublon (même nom, même endroit) et limite les propositions en attente', async () => {
    const author = await login();
    const name = `Centre ${unique()}`;
    expect((await propose(author, { name })).status).toBe(201);
    expect((await propose(author, { name: name.toUpperCase() })).status).toBe(409);

    for (let i = 0; i < 4; i += 1) expect((await propose(author, { name: `Lieu ${unique()}${i}`, latitude: base.latitude + 0.05 * (i + 1) })).status).toBe(201);
    const over = await propose(author, { name: `Trop ${unique()}`, latitude: base.latitude + 0.5 });
    expect(over.status).toBe(400);
    expect((await json<{ error: { code: string } }>(over)).error.code).toBe('PLACE_PENDING_LIMIT');
  });

  it('l’auteur peut retirer sa proposition, pas celle d’un autre', async () => {
    const author = await login();
    const other = await login();
    const place = await json<{ id: string }>(await propose(author));
    expect((await app.request(`/api/places/${place.id}`, { method: 'DELETE', headers: auth(other) })).status).toBe(404);
    expect((await app.request(`/api/places/${place.id}`, { method: 'DELETE', headers: auth(author) })).status).toBe(200);
  });

  it('exige une authentification', async () => {
    expect((await app.request(`/api/places?lat=${base.latitude}&lon=${base.longitude}`)).status).toBe(401);
    expect((await app.request('/api/admin/places')).status).toBe(401);
  });
});
