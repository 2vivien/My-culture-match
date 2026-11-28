import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { createApp } from '../../src/app';
import { db, schema } from '../../src/infrastructure/database';
import { redis } from '../../src/infrastructure/redis';
import { closeFeedFanoutQueue } from '../../src/modules/feed/feed.queue';
import { closeSearchQueue } from '../../src/modules/search/search.queue';
import { closeEmbeddingQueue } from '../../src/modules/culture-engine/embedding.queue';
import { closeCountersFlushQueue } from '../../src/modules/feed/counters.queue';
import { closeModerationQueue } from '../../src/modules/moderation/moderation.queue';
import { closeCultureEngineQueue } from '../../src/modules/culture-engine/batch.queue';

/**
 * Métriques Love (L8) — test d'intégration ÉCRIT MAIS NON EXÉCUTÉ (Docker indisponible à la rédaction).
 * Vérifie : accès réservé aux admins, forme agrégée de la réponse, absence d'identifiants.
 */
const app = createApp();
const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function onboardUser(prefix: string): Promise<{ token: string; userId: string }> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.41.${Math.floor(Math.random() * 200)}.1`;
  await app.request('/api/auth/send-otp', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify({ email }) });
  const raw = await redis.get(`otp:${email}`);
  const code = (JSON.parse(raw ?? '{}') as { code: string }).code;
  const verify = await app.request('/api/auth/verify-otp', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify({ email, code }) });
  const { token } = (await verify.json()) as { token: string };
  await app.request('/api/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email, name: 'Awa', username: `awa${unique()}`, avatarSeed: 'seed', gender: 'female', seeking: 'friendship', birthdate: '1995-06-15', roots: { country: 'Bénin', region: 'Atlantique', ethnicity: 'Fon', village: 'Abomey' }, languages: ['fr', 'fon'], intention: 'dating', acceptedTermsAt: new Date().toISOString() }),
  });
  const me = await app.request('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
  return { token, userId: ((await me.json()) as { id: string }).id };
}

const authed = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

beforeAll(async () => { await redis.flushall(); });
afterAll(async () => {
  await redis.flushall();
  await Promise.allSettled([closeSearchQueue(), closeEmbeddingQueue(), closeCountersFlushQueue(), closeFeedFanoutQueue(), closeModerationQueue(), closeCultureEngineQueue()]);
});

describe('GET /api/admin/love/metrics', () => {
  it('refuse un utilisateur non-admin', async () => {
    const user = await onboardUser('lmu');
    const res = await app.request('/api/admin/love/metrics', authed(user.token));
    expect(res.status).toBe(403);
  });

  it('renvoie un entonnoir agrégé sans identifiant', async () => {
    const admin = await onboardUser('lma');
    await db.update(schema.users).set({ role: 'admin' }).where(eq(schema.users.id, admin.userId));
    const res = await app.request('/api/admin/love/metrics', authed(admin.token));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { funnel: Record<string, number | null> };
    for (const key of ['questionnairesCompleted', 'requestsSent', 'requestsAccepted', 'requestsDeclined', 'requestsExpired', 'matches']) {
      expect(typeof body.funnel[key]).toBe('number');
    }
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain(admin.userId);
  });
});
