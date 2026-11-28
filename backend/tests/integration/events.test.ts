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

async function login(prefix = 'evt'): Promise<string> {
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
const inHours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();

async function adminToken(): Promise<string> {
  const t = await login();
  const id = await meId(t);
  await db.update(schema.users).set({ role: 'admin' }).where(eq(schema.users.id, id));
  await redis.del(`role:${id}`);
  return t;
}

/** Lieu culturel publié (proposé puis approuvé). */
async function publishedPlace(admin: string, proposer: string): Promise<string> {
  const res = await app.request('/api/places', { method: 'POST', headers: auth(proposer), body: JSON.stringify({ name: `Salle ${unique()}`, category: 'centre_culturel', ...here }) });
  expect(res.status).toBe(201);
  const { id } = await json<{ id: string }>(res);
  expect((await app.request(`/api/admin/places/${id}/approve`, { method: 'POST', headers: auth(admin), body: '{}' })).status).toBe(200);
  return id;
}

const createEvent = (token: string, over: Record<string, unknown>) =>
  app.request('/api/events', { method: 'POST', headers: auth(token), body: JSON.stringify({ title: `Soirée ${unique()}`, startsAt: inHours(24), ...over }) });
const listEvents = async (token: string) =>
  (await json<{ events: Array<{ id: string; going: number; interested: number; myRsvp: string | null }> }>(
    await app.request(`/api/events?lat=${here.latitude}&lon=${here.longitude}&radiusKm=10`, { headers: auth(token) }),
  )).events;

describe('événements — création', () => {
  it('un événement public exige un lieu culturel publié, jamais un point libre', async () => {
    const t = await login();
    const free = await createEvent(t, { visibility: 'public', point: here });
    expect(free.status).toBe(403);
    expect((await json<{ error: { code: string } }>(free)).error.code).toBe('EVENT_PUBLIC_REQUIRES_PUBLISHED_PLACE');

    // Un lieu simplement proposé (en attente) ne suffit pas.
    const pending = await json<{ id: string }>(await app.request('/api/places', { method: 'POST', headers: auth(t), body: JSON.stringify({ name: `Attente ${unique()}`, category: 'marche', ...here, latitude: here.latitude + 0.2 }) }));
    expect((await createEvent(t, { visibility: 'public', placeId: pending.id })).status).toBe(403);
  });

  it('un événement public dans un lieu publié est visible de tous', async () => {
    const admin = await adminToken();
    const organizer = await login();
    const stranger = await login();
    const placeId = await publishedPlace(admin, organizer);
    const res = await createEvent(organizer, { visibility: 'public', placeId });
    expect(res.status).toBe(201);
    const { id } = await json<{ id: string }>(res);
    expect((await listEvents(stranger)).map((e) => e.id)).toContain(id);
  });

  it('un événement « amis » n’est pas visible d’un inconnu, mais l’est de l’organisateur', async () => {
    const organizer = await login();
    const stranger = await login();
    const { id } = await json<{ id: string }>(await createEvent(organizer, { visibility: 'friends', point: { ...here, label: 'Chez moi' } }));
    expect((await listEvents(stranger)).map((e) => e.id)).not.toContain(id);
    expect((await app.request(`/api/events/${id}`, { headers: auth(stranger) })).status).toBe(404);
    expect((await listEvents(organizer)).map((e) => e.id)).toContain(id);
  });

  it('refuse un horaire passé, une fin avant le début et les champs inconnus', async () => {
    const t = await login();
    expect((await createEvent(t, { visibility: 'friends', point: here, startsAt: inHours(-5) })).status).toBe(400);
    expect((await createEvent(t, { visibility: 'friends', point: here, startsAt: inHours(5), endsAt: inHours(4) })).status).toBe(400);
    expect((await createEvent(t, { visibility: 'friends', point: here, organizerId: 'x' })).status).toBe(400);
  });

  it('un événement de tribu exige d’en être modérateur ; un simple membre est refusé', async () => {
    const owner = await login();
    const member = await login();
    const tribe = await app.request('/api/tribes', { method: 'POST', headers: auth(owner), body: JSON.stringify({ name: `Tribu ${unique()}`, tag: `evt-${unique()}`, topic: 'danse', description: 'Tribu de test pour les événements.', rules: [{ title: 'Respect', description: 'Pas d’insultes' }, { title: 'Authenticité', description: 'Contenus vérifiés' }] }) });
    const tribeId = (await json<{ id: string }>(tribe)).id;
    await app.request(`/api/tribes/${tribeId}/join`, { method: 'POST', headers: auth(member) });

    expect((await createEvent(member, { visibility: 'tribe', tribeId, point: here })).status).toBe(403);
    const ok = await createEvent(owner, { visibility: 'tribe', tribeId, point: here });
    expect(ok.status).toBe(201);
    const { id } = await json<{ id: string }>(ok);

    const outsider = await login();
    expect((await listEvents(member)).map((e) => e.id)).toContain(id);
    expect((await listEvents(outsider)).map((e) => e.id)).not.toContain(id);
  });
});

describe('événements — réponses et annulation', () => {
  it('répondre « going » puis « interested », compter, et retirer sa réponse', async () => {
    const admin = await adminToken();
    const organizer = await login();
    const guest = await login();
    const placeId = await publishedPlace(admin, organizer);
    const { id } = await json<{ id: string }>(await createEvent(organizer, { visibility: 'public', placeId }));
    const rsvp = (status: string | null) => app.request(`/api/events/${id}/rsvp`, { method: 'POST', headers: auth(guest), body: JSON.stringify({ status }) });

    expect(await json<{ going: number; myRsvp: string }>(await rsvp('going'))).toMatchObject({ going: 1, myRsvp: 'going' });
    expect(await json<{ going: number; interested: number; myRsvp: string }>(await rsvp('interested'))).toMatchObject({ going: 0, interested: 1, myRsvp: 'interested' });
    expect(await json<{ interested: number; myRsvp: string | null }>(await rsvp(null))).toMatchObject({ interested: 0, myRsvp: null });
    expect((await rsvp('maybe' as never)).status).toBe(400);
  });

  it('on ne peut pas répondre à un événement qu’on ne voit pas', async () => {
    const organizer = await login();
    const stranger = await login();
    const { id } = await json<{ id: string }>(await createEvent(organizer, { visibility: 'friends', point: here }));
    const res = await app.request(`/api/events/${id}/rsvp`, { method: 'POST', headers: auth(stranger), body: JSON.stringify({ status: 'going' }) });
    expect(res.status).toBe(404);
  });

  it('l’organisateur annule : plus de réponse possible, et seul lui peut annuler', async () => {
    const admin = await adminToken();
    const organizer = await login();
    const guest = await login();
    const placeId = await publishedPlace(admin, organizer);
    const { id } = await json<{ id: string }>(await createEvent(organizer, { visibility: 'public', placeId }));

    expect((await app.request(`/api/events/${id}`, { method: 'DELETE', headers: auth(guest) })).status).toBe(404);
    expect((await app.request(`/api/events/${id}`, { method: 'DELETE', headers: auth(organizer) })).status).toBe(200);
    expect((await listEvents(guest)).map((e) => e.id)).not.toContain(id);
    const res = await app.request(`/api/events/${id}/rsvp`, { method: 'POST', headers: auth(guest), body: JSON.stringify({ status: 'going' }) });
    expect(res.status).toBe(400);
  });

  it('un lieu retiré par la modération masque ses événements publics', async () => {
    const admin = await adminToken();
    const organizer = await login();
    const stranger = await login();
    const placeId = await publishedPlace(admin, organizer);
    const { id } = await json<{ id: string }>(await createEvent(organizer, { visibility: 'public', placeId }));
    expect((await listEvents(stranger)).map((e) => e.id)).toContain(id);

    await app.request(`/api/admin/places/${placeId}/reject`, { method: 'POST', headers: auth(admin), body: JSON.stringify({ reason: 'Adresse privée' }) });
    expect((await listEvents(stranger)).map((e) => e.id)).not.toContain(id);
    expect((await app.request(`/api/events/${id}`, { headers: auth(stranger) })).status).toBe(404);
  });

  it('exige une authentification', async () => {
    expect((await app.request(`/api/events?lat=${here.latitude}&lon=${here.longitude}`)).status).toBe(401);
  });
});
