// Test d'intégration F9 — nécessite Postgres + Redis (Docker) : écrit mais NON exécuté dans l'environnement de rédaction.
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

async function onboardUser(prefix: string): Promise<{ token: string; userId: string }> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.62.${Math.floor(Math.random() * 200)}.1`;
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

  await app.request('/api/onboarding', {
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

  const me = await app.request('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
  const body = (await me.json()) as { id: string };
  return { token, userId: body.id };
}

const authed = (token: string, method = 'GET') => ({
  method,
  headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
});
const authedJson = (token: string, body: unknown, method = 'POST') => ({
  method,
  headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(body),
});

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

type Notif = { id: string; type: string; action: string | null; metadata: unknown; target: string | null; user: { id: string } };
type User = { token: string; userId: string };
const coords = { latitude: 6.37, longitude: 2.39 };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function becomeCompanions(a: User, b: User) {
  await app.request(`/api/connections/${b.userId}/request`, authed(a.token, 'POST'));
  const list = (await (await app.request('/api/notifications', authed(b.token))).json()) as Notif[];
  const request = list.find((n) => n.type === 'request' && n.user.id === a.userId);
  await app.request(`/api/notifications/${request!.id}/accept`, authed(b.token, 'POST'));
}

/** Position partagée (consentement explicite) puis, si demandé, opt-in à la notification. */
async function share(u: User, optIn: boolean) {
  await app.request('/api/users/me/location', authedJson(u.token, { ...coords, enabled: true, consent: true }, 'PATCH'));
  if (optIn) await app.request('/api/location/nearby-notify', authedJson(u.token, { enabled: true }, 'PATCH'));
}

/** Le heartbeat répond tout de suite ; l'envoi est asynchrone : on laisse le temps au balayage. */
async function heartbeat(u: User) {
  await redis.del(`nearby:notif:scan:${u.userId}`);
  const res = await app.request('/api/location/heartbeat', authedJson(u.token, coords));
  await sleep(800);
  return res;
}

const nearbyNotifs = async (u: User) =>
  ((await (await app.request('/api/notifications', authed(u.token))).json()) as Notif[]).filter((n) => n.action === 'nearby_person');

describe('F9 — notification « près de toi » (opt-in, plafonnée)', () => {
  it('réglage désactivé par défaut ; exige un booléen explicite', async () => {
    const u = await onboardUser('nn');
    const get = async () => (await (await app.request('/api/location/nearby-notify', authed(u.token))).json()) as { nearbyNotify: boolean };
    expect((await get()).nearbyNotify).toBe(false);
    expect((await app.request('/api/location/nearby-notify', authedJson(u.token, {}, 'PATCH'))).status).toBe(400);
    expect((await app.request('/api/location/nearby-notify', authedJson(u.token, { enabled: 'yes' }, 'PATCH'))).status).toBe(400);
    expect((await get()).nearbyNotify).toBe(false);
    expect((await app.request('/api/location/nearby-notify', authedJson(u.token, { enabled: true }, 'PATCH'))).status).toBe(200);
    expect((await get()).nearbyNotify).toBe(true);
  });

  it('sans opt-in du destinataire : aucune notification', async () => {
    const a = await onboardUser('nn');
    const b = await onboardUser('nn');
    await becomeCompanions(a, b);
    await share(b, false);
    await share(a, true);
    await heartbeat(a);
    expect(await nearbyNotifs(b)).toHaveLength(0);
  });

  it('opt-in + compagnon visible : une notification, sans distance ni position ; pas de doublon sur la paire', async () => {
    const a = await onboardUser('nn');
    const b = await onboardUser('nn');
    await becomeCompanions(a, b);
    await share(b, true);
    await share(a, false);
    await heartbeat(a);
    const first = await nearbyNotifs(b);
    expect(first).toHaveLength(1);
    expect(first[0]!.user.id).toBe(a.userId);
    expect(first[0]!.metadata ?? null).toBeNull();
    expect(JSON.stringify(first[0])).not.toMatch(/latitude|longitude|distance|\bkm\b/i);

    await heartbeat(a);
    expect(await nearbyNotifs(b)).toHaveLength(1);
  });

  it('un émetteur en mode fantôme n’émet rien (heartbeat refusé)', async () => {
    const a = await onboardUser('nn');
    const b = await onboardUser('nn');
    await becomeCompanions(a, b);
    await share(b, true);
    await share(a, false);
    await app.request('/api/location/settings', authedJson(a.token, { ghostMode: true }, 'PATCH'));
    const res = await heartbeat(a);
    expect(res.status).toBe(403);
    expect(await nearbyNotifs(b)).toHaveLength(0);
  });

  it('un émetteur invisible pour le destinataire (visibilité « nobody ») n’émet rien', async () => {
    const a = await onboardUser('nn');
    const b = await onboardUser('nn');
    await becomeCompanions(a, b);
    await share(b, true);
    await share(a, false);
    await app.request('/api/location/settings', authedJson(a.token, { visibility: 'nobody' }, 'PATCH'));
    await heartbeat(a);
    expect(await nearbyNotifs(b)).toHaveLength(0);
  });

  it('un blocage supprime la notification', async () => {
    const a = await onboardUser('nn');
    const b = await onboardUser('nn');
    await becomeCompanions(a, b);
    await share(b, true);
    await share(a, false);
    await app.request(`/api/safety/users/${a.userId}/block`, authed(b.token, 'POST'));
    await heartbeat(a);
    expect(await nearbyNotifs(b)).toHaveLength(0);
  });

  it('au plus 3 notifications par destinataire et par jour', async () => {
    const b = await onboardUser('nn');
    await share(b, true);
    const emitters: User[] = [];
    for (let i = 0; i < 4; i += 1) {
      const e = await onboardUser('nn');
      await becomeCompanions(e, b);
      await share(e, false);
      emitters.push(e);
    }
    for (const e of emitters) await heartbeat(e);
    expect(await nearbyNotifs(b)).toHaveLength(3);
  });
});
