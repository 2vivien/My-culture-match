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

const app = createApp();

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function getOtpCode(email: string): Promise<string> {
  const raw = await redis.get(`otp:${email}`);
  if (!raw) throw new Error(`OTP introuvable pour ${email}`);
  return (JSON.parse(raw) as { code: string }).code;
}

async function onboardUser(prefix: string): Promise<{ token: string; userId: string; email: string }> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.40.${Math.floor(Math.random() * 200)}.1`;
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
  return { token, userId: body.id, email };
}

const authed = (token: string, method = 'GET') => ({
  method,
  headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
});
const authedJson = (token: string, body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify(body),
});

async function makeAdmin(userId: string): Promise<void> {
  await db.update(schema.users).set({ role: 'admin' }).where(eq(schema.users.id, userId));
}

beforeAll(async () => {
  await redis.flushall();
});

afterAll(async () => {
  await redis.flushall();
  await Promise.allSettled([
    closeSearchQueue(),
    closeEmbeddingQueue(),
    closeCountersFlushQueue(),
    closeFeedFanoutQueue(),
    closeModerationQueue(),
    closeCultureEngineQueue(),
  ]);
});

describe('Admin & modération (L12)', () => {
  it('refuse l’accès admin à un utilisateur non-admin', async () => {
    const user = await onboardUser('usr');
    const res = await app.request('/api/admin/stats', authed(user.token));
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: { code?: string } };
    expect(body.error?.code).toBe('ADMIN_REQUIRED');
  });

  it('liste les signalements et applique une action de modération', async () => {
    const admin = await onboardUser('adm');
    const target = await onboardUser('tgt');
    await makeAdmin(admin.userId);

    const created = await app.request(
      '/api/reports',
      authedJson(target.token, {
        targetType: 'user',
        targetId: admin.userId,
        reason: 'harassment',
        description: 'Messages agressifs répétés',
      }),
    );
    expect(created.status).toBe(201);
    const { id } = (await created.json()) as { id: string };

    const list = await app.request('/api/admin/reports', authed(admin.token));
    expect(list.status).toBe(200);
    const body = (await list.json()) as { reports: { id: string; status: string }[] };
    expect(body.reports.map((r) => r.id)).toContain(id);

    const acted = await app.request(`/api/admin/reports/${id}/action`, authedJson(admin.token, { action: 'dismiss', reason: 'Aucune preuve' }));
    expect(acted.status).toBe(200);

    const [row] = await db.select({ status: schema.reports.status }).from(schema.reports).where(eq(schema.reports.id, id)).limit(1);
    expect(row?.status).toBe('dismissed');

    const audits = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.action, 'report.dismiss'));
    expect(audits.length).toBeGreaterThan(0);
  });

  it('sanctionne un signalement (ban) et bloque le compte', async () => {
    const admin = await onboardUser('ad2');
    const target = await onboardUser('tg2');
    await makeAdmin(admin.userId);

    const banned = await app.request(`/api/admin/users/${target.userId}/ban`, authedJson(admin.token, { reason: 'Spam massif', durationDays: 30 }));
    expect(banned.status).toBe(200);
    const { banned: isBanned } = (await banned.json()) as { banned: boolean };
    expect(isBanned).toBe(true);

    // Session existante : refusée par requireAuth (ACCOUNT_BANNED)
    const me = await app.request('/api/users/me', authed(target.token));
    expect(me.status).toBe(403);
    const body = (await me.json()) as { error?: { code?: string } };
    expect(body.error?.code).toBe('ACCOUNT_BANNED');

    // Nouvelle tentative de connexion : refusée
    await app.request('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: target.email }),
    });
    const code = await getOtpCode(target.email);
    const login = await app.request('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: target.email, code }),
    });
    expect(login.status).toBe(403);

    // Déban : le compte se reconnecte
    const unbanned = await app.request(`/api/admin/users/${target.userId}/unban`, authedJson(admin.token, { reason: 'Recours accepté' }));
    expect(unbanned.status).toBe(200);

    await app.request('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: target.email }),
    });
    const code2 = await getOtpCode(target.email);
    const relogin = await app.request('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: target.email, code: code2 }),
    });
    expect(relogin.status).toBe(200);
  });

  it('renvoie les stats globales admin', async () => {
    const admin = await onboardUser('ad3');
    await makeAdmin(admin.userId);
    const res = await app.request('/api/admin/stats', authed(admin.token));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, number>;
    expect(body.totalUsers).toBeGreaterThanOrEqual(1);
    expect(typeof body.flaggedPosts).toBe('number');
  });
});
