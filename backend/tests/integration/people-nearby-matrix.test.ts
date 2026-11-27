import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app';
import { redis } from '../../src/infrastructure/redis';
import { closeFeedFanoutQueue } from '../../src/modules/feed/feed.queue';
import { closeSearchQueue } from '../../src/modules/search/search.queue';
import { closeEmbeddingQueue } from '../../src/modules/culture-engine/embedding.queue';
import { closeCountersFlushQueue } from '../../src/modules/feed/counters.queue';

/**
 * Matrice de bout en bout de GET /api/location/nearby : visibilité × relation × blocage × fantôme ×
 * expiration × audience × rayon × partage désactivé. La logique pure est couverte en détail dans
 * tests/unit/location/location.nearby.filter.test.ts ; ici on vérifie le câblage réel (SQL, listes, blocages).
 */

const app = createApp();

const unique = () => `${Date.now()}${Math.floor(Math.random() * 100000)}`;

async function getOtpCode(email: string): Promise<string> {
  const raw = await redis.get(`otp:${email}`);
  if (!raw) throw new Error(`OTP introuvable pour ${email}`);
  return (JSON.parse(raw) as { code: string }).code;
}

interface TestUser { token: string; userId: string }

/** Connexion OTP puis onboarding (profileCompleted est exigé pour apparaître sur la carte). */
async function onboardUser(prefix = 'nbm'): Promise<TestUser> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.70.${Math.floor(Math.random() * 200)}.1`;
  await app.request('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email }),
  });
  const code = await getOtpCode(email);
  const verify = await app.request('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ email, code }),
  });
  const { token } = (await verify.json()) as { token: string };

  const res = await app.request('/api/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      email,
      name: 'Awa',
      username: `awa${unique()}`,
      avatarSeed: 'seed',
      gender: 'female',
      seeking: 'friendship',
      birthdate: '1995-06-15',
      roots: { country: 'Bénin', region: 'Atlantique', ethnicity: 'Fon', village: 'Abomey' },
      languages: ['fr', 'fon'],
      intention: 'dating',
      acceptedTermsAt: new Date().toISOString(),
    }),
  });
  expect(res.status).toBe(201);
  const me = await app.request('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
  const body = (await me.json()) as { id: string };
  return { token, userId: body.id };
}

const auth = (token: string) => ({ 'content-type': 'application/json', Authorization: `Bearer ${token}` });
const call = (token: string, method: string, path: string, body?: unknown) =>
  app.request(path, { method, headers: auth(token), ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

// Cotonou : le demandeur n'a pas de position partagée, il fournit la sienne en paramètre de requête.
const ORIGIN = { latitude: 6.37, longitude: 2.39 };
const NEAR = { latitude: 6.4, longitude: 2.4 }; // ~3 km
const FAR = { latitude: 7.1, longitude: 2.39 }; // ~80 km

const nearbyIds = async (viewer: TestUser): Promise<string[]> => {
  const res = await call(viewer.token, 'GET', `/api/location/nearby?lat=${ORIGIN.latitude}&lon=${ORIGIN.longitude}`);
  expect(res.status).toBe(200);
  const body = (await res.json()) as { people: Array<{ id: string }> };
  return body.people.map((p) => p.id);
};

/** Crée un utilisateur qui partage sa position avec les réglages donnés. */
async function sharer(settings: Record<string, unknown> = {}, position = NEAR): Promise<TestUser> {
  const u = await onboardUser('sh');
  expect((await call(u.token, 'PATCH', '/api/users/me/location', { ...position, enabled: true, consent: true })).status).toBe(200);
  const res = await call(u.token, 'PATCH', '/api/location/settings', { visibility: 'nearby', ...settings });
  expect(res.status).toBe(200);
  return u;
}

async function befriend(a: TestUser, b: TestUser) {
  expect((await call(a.token, 'POST', `/api/connections/${b.userId}/request`)).status).toBe(200);
  expect((await call(b.token, 'POST', `/api/requests/${a.userId}/accept`)).status).toBe(200);
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

describe('GET /api/location/nearby — visibilité × relation', () => {
  it('nearby et everyone : un inconnu proche est visible ; nobody et friends : non', async () => {
    const viewer = await onboardUser('v');
    const nearby = await sharer({ visibility: 'nearby' });
    const everyone = await sharer({ visibility: 'everyone' });
    const nobody = await sharer({ visibility: 'nobody' });
    const friendsOnly = await sharer({ visibility: 'friends' });
    const fofOnly = await sharer({ visibility: 'friends_of_friends' });
    const ids = await nearbyIds(viewer);
    expect(ids).toContain(nearby.userId);
    expect(ids).toContain(everyone.userId);
    expect(ids).not.toContain(nobody.userId);
    expect(ids).not.toContain(friendsOnly.userId);
    expect(ids).not.toContain(fofOnly.userId);
  });

  it('friends : visible une fois compagnon, invisible de nouveau après suppression du compagnon', async () => {
    const viewer = await onboardUser('v');
    const owner = await sharer({ visibility: 'friends' });
    expect(await nearbyIds(viewer)).not.toContain(owner.userId);
    await befriend(viewer, owner);
    expect(await nearbyIds(viewer)).toContain(owner.userId);
    expect((await call(viewer.token, 'DELETE', `/api/connections/${owner.userId}`)).status).toBe(200);
    expect(await nearbyIds(viewer)).not.toContain(owner.userId);
  });

  it('friends_of_friends : visible pour l’ami d’un ami, pas pour un inconnu', async () => {
    const viewer = await onboardUser('v');
    const stranger = await onboardUser('s');
    const bridge = await onboardUser('b');
    const owner = await sharer({ visibility: 'friends_of_friends' });
    await befriend(viewer, bridge);
    await befriend(bridge, owner);
    expect(await nearbyIds(viewer)).toContain(owner.userId);
    expect(await nearbyIds(stranger)).not.toContain(owner.userId);
  });
});

describe('GET /api/location/nearby — refus de sécurité', () => {
  it('un utilisateur bloqué (dans un sens ou dans l’autre) n’apparaît jamais, même en everyone et compagnon', async () => {
    const viewer = await onboardUser('v');
    const blockedByViewer = await sharer({ visibility: 'everyone' });
    const blockerOfViewer = await sharer({ visibility: 'everyone' });
    await befriend(viewer, blockedByViewer);
    await befriend(viewer, blockerOfViewer);
    expect(await nearbyIds(viewer)).toEqual(expect.arrayContaining([blockedByViewer.userId, blockerOfViewer.userId]));

    expect((await call(viewer.token, 'POST', `/api/safety/users/${blockedByViewer.userId}/block`)).status).toBe(201);
    expect((await call(blockerOfViewer.token, 'POST', `/api/safety/users/${viewer.userId}/block`)).status).toBe(201);
    const ids = await nearbyIds(viewer);
    expect(ids).not.toContain(blockedByViewer.userId);
    expect(ids).not.toContain(blockerOfViewer.userId);
  });

  it('le mode fantôme masque, même un compagnon en everyone ; le désactiver rend visible', async () => {
    const viewer = await onboardUser('v');
    const owner = await sharer({ visibility: 'everyone' });
    await befriend(viewer, owner);
    expect(await nearbyIds(viewer)).toContain(owner.userId);
    await call(owner.token, 'PATCH', '/api/location/settings', { ghostMode: true });
    expect(await nearbyIds(viewer)).not.toContain(owner.userId);
    await call(owner.token, 'PATCH', '/api/location/settings', { ghostMode: false });
    expect(await nearbyIds(viewer)).toContain(owner.userId);
  });

  it('un partage expiré masque ; une expiration future ne masque pas', async () => {
    const viewer = await onboardUser('v');
    const expired = await sharer({ visibility: 'everyone', expiresAt: new Date(Date.now() - 60_000).toISOString() });
    const future = await sharer({ visibility: 'everyone', expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
    const ids = await nearbyIds(viewer);
    expect(ids).not.toContain(expired.userId);
    expect(ids).toContain(future.userId);
  });

  it('partage désactivé : disparaît de la carte (coordonnées effacées)', async () => {
    const viewer = await onboardUser('v');
    const owner = await sharer({ visibility: 'everyone' });
    expect(await nearbyIds(viewer)).toContain(owner.userId);
    expect((await call(owner.token, 'PATCH', '/api/location/settings', { sharingEnabled: false })).status).toBe(200);
    expect(await nearbyIds(viewer)).not.toContain(owner.userId);
  });

  it('au-delà de 50 km : absent, même en everyone et compagnon', async () => {
    const viewer = await onboardUser('v');
    const far = await sharer({ visibility: 'everyone' }, FAR);
    const near = await sharer({ visibility: 'everyone' });
    await befriend(viewer, far);
    const ids = await nearbyIds(viewer);
    expect(ids).not.toContain(far.userId);
    expect(ids).toContain(near.userId);
  });

  it('le demandeur ne se voit jamais lui-même', async () => {
    const me = await sharer({ visibility: 'everyone' });
    expect(await nearbyIds(me)).not.toContain(me.userId);
  });

  it('sans authentification : 401', async () => {
    const res = await app.request(`/api/location/nearby?lat=${ORIGIN.latitude}&lon=${ORIGIN.longitude}`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/location/nearby — audience', () => {
  it('selected : seuls les compagnons listés voient ; un compagnon non listé et un inconnu non', async () => {
    const listed = await onboardUser('l');
    const notListed = await onboardUser('n');
    const stranger = await onboardUser('s');
    const owner = await sharer({ visibility: 'nearby', audienceMode: 'selected' });
    await befriend(owner, listed);
    await befriend(owner, notListed);
    expect((await call(owner.token, 'PUT', '/api/location/audience', { memberIds: [listed.userId] })).status).toBe(200);
    expect(await nearbyIds(listed)).toContain(owner.userId);
    expect(await nearbyIds(notListed)).not.toContain(owner.userId);
    expect(await nearbyIds(stranger)).not.toContain(owner.userId);
  });

  it('selected : un ancien compagnon n’y a plus accès', async () => {
    const listed = await onboardUser('l');
    const owner = await sharer({ visibility: 'nearby', audienceMode: 'selected' });
    await befriend(owner, listed);
    await call(owner.token, 'PUT', '/api/location/audience', { memberIds: [listed.userId] });
    expect(await nearbyIds(listed)).toContain(owner.userId);
    expect((await call(owner.token, 'DELETE', `/api/connections/${listed.userId}`)).status).toBe(200);
    expect(await nearbyIds(listed)).not.toContain(owner.userId);
  });

  it('selected : un compagnon listé puis bloqué n’y a plus accès', async () => {
    const listed = await onboardUser('l');
    const owner = await sharer({ visibility: 'nearby', audienceMode: 'selected' });
    await befriend(owner, listed);
    await call(owner.token, 'PUT', '/api/location/audience', { memberIds: [listed.userId] });
    await call(owner.token, 'POST', `/api/safety/users/${listed.userId}/block`);
    expect(await nearbyIds(listed)).not.toContain(owner.userId);
  });

  it('except : tous ceux que la visibilité autorise, sauf les listés', async () => {
    const excluded = await onboardUser('x');
    const other = await onboardUser('o');
    const owner = await sharer({ visibility: 'nearby', audienceMode: 'except' });
    await befriend(owner, excluded);
    expect((await call(owner.token, 'PUT', '/api/location/audience', { memberIds: [excluded.userId] })).status).toBe(200);
    expect(await nearbyIds(excluded)).not.toContain(owner.userId);
    expect(await nearbyIds(other)).toContain(owner.userId);
  });

  it('nobody l’emporte sur toute audience', async () => {
    const listed = await onboardUser('l');
    const owner = await sharer({ visibility: 'nobody', audienceMode: 'selected' });
    await befriend(owner, listed);
    await call(owner.token, 'PUT', '/api/location/audience', { memberIds: [listed.userId] });
    expect(await nearbyIds(listed)).not.toContain(owner.userId);
  });
});
