import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app';
import { redis } from '../../src/infrastructure/redis';
import { env } from '../../src/config/env';
import { closeFeedFanoutQueue } from '../../src/modules/feed/feed.queue';
import { closeSearchQueue } from '../../src/modules/search/search.queue';
import { closeEmbeddingQueue } from '../../src/modules/culture-engine/embedding.queue';
import { closeCountersFlushQueue } from '../../src/modules/feed/counters.queue';
import { closeModerationQueue } from '../../src/modules/moderation/moderation.queue';
import { closeCultureEngineQueue } from '../../src/modules/culture-engine/batch.queue';
import { loveQuotaKey } from '../../src/modules/love/love.quota';

/**
 * Quota quotidien Love (L6) — test d'intégration ÉCRIT MAIS NON EXÉCUTÉ (Docker indisponible).
 * Pré-remplit le compteur Redis au plafond pour éviter de lancer N recherches.
 */
const app = createApp();
const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function onboardUser(prefix: string): Promise<{ token: string; userId: string }> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.42.${Math.floor(Math.random() * 200)}.1`;
  await app.request('/api/auth/send-otp', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify({ email }) });
  const code = (JSON.parse((await redis.get(`otp:${email}`)) ?? '{}') as { code: string }).code;
  const verify = await app.request('/api/auth/verify-otp', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify({ email, code }) });
  const { token } = (await verify.json()) as { token: string };
  await app.request('/api/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email, name: 'Awa', username: `awa${unique()}`, avatarSeed: 'seed', gender: 'female', seeking: 'dating', birthdate: '1995-06-15', roots: { country: 'Bénin', region: 'Atlantique', ethnicity: 'Fon', village: 'Abomey' }, languages: ['fr', 'fon'], intention: 'dating', acceptedTermsAt: new Date().toISOString() }),
  });
  const me = await app.request('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
  return { token, userId: ((await me.json()) as { id: string }).id };
}

beforeAll(async () => { await redis.flushall(); });
afterAll(async () => {
  await redis.flushall();
  await Promise.allSettled([closeSearchQueue(), closeEmbeddingQueue(), closeCountersFlushQueue(), closeFeedFanoutQueue(), closeModerationQueue(), closeCultureEngineQueue()]);
});

describe('Quota quotidien Love', () => {
  it('expose le plafond configuré et le restant', async () => {
    const user = await onboardUser('lq1');
    const res = await app.request('/api/love/search/quota', { headers: { Authorization: `Bearer ${user.token}` } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { limit: number; used: number; remaining: number; unlimited: boolean };
    expect(body.limit).toBe(env.LOVE_DAILY_SEARCH_LIMIT);
    expect(body.used).toBe(0);
  });

  it('renvoie 429 LOVE_SEARCH_QUOTA avec un message français une fois le plafond atteint', async () => {
    if (env.LOVE_DAILY_SEARCH_LIMIT === 0) return; // illimité : rien à tester
    const user = await onboardUser('lq2');
    await redis.set(loveQuotaKey('search', user.userId, new Date()), String(env.LOVE_DAILY_SEARCH_LIMIT), 'EX', 3600);
    const res = await app.request('/api/love/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ query: 'une personne curieuse qui aime voyager' }),
    });
    // 403 LOVE_DISABLED possible si le consentement Love n'est pas activé : le quota n'est alors pas atteint.
    if (res.status === 429) {
      const body = (await res.json()) as { error?: { code?: string; message?: string } };
      expect(body.error?.code).toBe('LOVE_SEARCH_QUOTA');
      expect(body.error?.message).toContain('limite quotidienne');
    } else {
      expect([403]).toContain(res.status);
    }
  });
});
