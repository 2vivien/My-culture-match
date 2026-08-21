import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app';
import { redis } from '../../src/infrastructure/redis';
import { generateTotpCode } from '../../src/shared/utils/totp';
import { db, schema } from '../../src/infrastructure/database';
import { eq } from 'drizzle-orm';

const app = createApp();

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function getOtpCode(email: string): Promise<string> {
  const raw = await redis.get(`otp:${email}`);
  if (!raw) throw new Error(`OTP introuvable pour ${email}`);
  return (JSON.parse(raw) as { code: string }).code;
}

interface Session {
  token: string;
  email: string;
  userId: string;
}

async function login(prefix = 'set'): Promise<Session> {
  const email = `${prefix}-${unique()}@example.com`;
  const ip = `10.30.${Math.floor(Math.random() * 200)}.1`;
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
  const body = (await res.json()) as { token: string; user: { id: string } };
  return { token: body.token, email, userId: body.user.id };
}

async function auditActions(userId: string): Promise<string[]> {
  const rows = await db.select({ action: schema.auditLogs.action }).from(schema.auditLogs).where(eq(schema.auditLogs.userId, userId));
  return rows.map((r) => r.action);
}

beforeAll(async () => {
  await redis.flushall();
});

afterAll(async () => {
  await redis.flushall();
  await redis.quit();
});

describe('GET /api/settings', () => {
  it('renvoie les paramètres par défaut', async () => {
    const { token } = await login();
    const res = await app.request('/api/settings', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { theme: string; notificationsEnabled: boolean; twoFactor: boolean };
    expect(body.theme).toBe('light');
    expect(body.notificationsEnabled).toBe(true);
    expect(body.twoFactor).toBe(false);
  });

  it('refuse sans token (401)', async () => {
    const res = await app.request('/api/settings');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/settings', () => {
  it('met à jour le thème et la langue', async () => {
    const { token } = await login();
    const res = await app.request('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ theme: 'dark', language: 'en' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { theme: string; language: string };
    expect(body.theme).toBe('dark');
    expect(body.language).toBe('en');
  });

  it('rate limit à 5 modifications/heure (429)', async () => {
    const { token } = await login();
    for (let i = 0; i < 5; i++) {
      const ok = await app.request('/api/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ theme: i % 2 ? 'dark' : 'light' }),
      });
      expect(ok.status).toBe(200);
    }
    const blocked = await app.request('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ theme: 'system' }),
    });
    expect(blocked.status).toBe(429);
  });

  it('rejette un champ inconnu (400 strict)', async () => {
    const { token } = await login();
    const res = await app.request('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ hacker: true }),
    });
    expect(res.status).toBe(400);
  });
});

describe('2FA TOTP', () => {
  it('génère un secret + QR code, puis active la 2FA', async () => {
    const { token, email, userId } = await login();

    const start = await app.request('/api/settings/2fa/start', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(start.status).toBe(200);
    const startBody = (await start.json()) as { secret: string; otpauthUrl: string; qrCodeDataUrl: string };
    expect(startBody.secret.length).toBeGreaterThanOrEqual(16);
    expect(startBody.otpauthUrl).toContain(`secret=${encodeURIComponent(startBody.secret)}`);
    expect(startBody.otpauthUrl).toContain(encodeURIComponent(email));
    expect(startBody.qrCodeDataUrl.startsWith('data:image/png;base64,')).toBe(true);

    const code = generateTotpCode(startBody.secret);
    const verify = await app.request('/api/settings/2fa/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code }),
    });
    expect(verify.status).toBe(200);
    const body = (await verify.json()) as { twoFactor: boolean };
    expect(body.twoFactor).toBe(true);

    expect(await auditActions(userId)).toContain('two_factor_enabled');
  });

  it('refuse un code TOTP invalide (400)', async () => {
    const { token } = await login();
    await app.request('/api/settings/2fa/start', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await app.request('/api/settings/2fa/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: '000000' }),
    });
    expect(res.status).toBe(400);
  });

  it('désactive la 2FA après vérification (audit)', async () => {
    const { token, userId } = await login();
    const start = await app.request('/api/settings/2fa/start', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const { secret } = (await start.json()) as { secret: string };
    const code = generateTotpCode(secret);
    await app.request('/api/settings/2fa/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code }),
    });

    const disable = await app.request('/api/settings/2fa/disable', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code }),
    });
    expect(disable.status).toBe(200);
    const body = (await disable.json()) as { twoFactor: boolean };
    expect(body.twoFactor).toBe(false);

    const actions = await auditActions(userId);
    expect(actions).toContain('two_factor_disabled');
  });
});

describe('Changement d’email', () => {
  it('valide par code OTP et applique le changement (audit)', async () => {
    const { token, userId } = await login();
    const newEmail = `new-${unique()}@example.com`;

    const request = await app.request('/api/settings/email/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ newEmail }),
    });
    expect(request.status).toBe(200);

    const code = await getOtpCode(newEmail);
    const change = await app.request('/api/settings/email/change', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ newEmail, code }),
    });
    expect(change.status).toBe(200);
    const body = (await change.json()) as { email: string };
    expect(body.email).toBe(newEmail);

    const actions = await auditActions(userId);
    expect(actions).toContain('email_changed');
  });

  it('refuse un code erroné (400)', async () => {
    const { token } = await login();
    const newEmail = `bad-${unique()}@example.com`;
    await app.request('/api/settings/email/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ newEmail }),
    });
    const res = await app.request('/api/settings/email/change', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ newEmail, code: '000000' }),
    });
    expect(res.status).toBe(400);
  });

  it('refuse un email déjà utilisé (409)', async () => {
    const { token } = await login('existing');
    const { email: takenEmail } = await login('holder');
    const res = await app.request('/api/settings/email/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ newEmail: takenEmail }),
    });
    expect(res.status).toBe(409);
  });
});
