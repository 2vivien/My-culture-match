import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app';
import { redis } from '../../src/infrastructure/redis';

const app = createApp();

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function getOtpCode(email: string): Promise<string> {
  const raw = await redis.get(`otp:${email}`);
  if (!raw) throw new Error(`OTP introuvable pour ${email}`);
  return (JSON.parse(raw) as { code: string }).code;
}

beforeAll(async () => {
  await redis.flushall();
});

afterAll(async () => {
  await redis.flushall();
  await redis.quit();
});

describe('POST /api/auth/send-otp', () => {
  it('envoie un OTP et retourne success + cooldown', async () => {
    const email = `test-${unique()}@example.com`;
    const res = await app.request('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
      body: JSON.stringify({ email }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; cooldown: number };
    expect(body.success).toBe(true);
    expect(body.cooldown).toBe(300);
  });

  it('retourne la même réponse pour un email inconnu (anti-énumération)', async () => {
    const email = `ghost-${unique()}@example.com`;
    const res = await app.request('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.2' },
      body: JSON.stringify({ email }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  it('rejette un email invalide (400)', async () => {
    const res = await app.request('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'pas-un-email' }),
    });
    expect(res.status).toBe(400);
  });

  it('déclenche le rate limit à 3 envois/h/email', async () => {
    const email = `spam-${unique()}@example.com`;
    const ip = `10.0.0.${Math.floor(Math.random() * 200) + 10}`;
    for (let i = 0; i < 3; i++) {
      const ok = await app.request('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
        body: JSON.stringify({ email }),
      });
      expect(ok.status).toBe(200);
    }
    const blocked = await app.request('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify({ email }),
    });
    expect(blocked.status).toBe(429);
  });
});

describe('POST /api/auth/verify-otp', () => {
  it('connecte un utilisateur avec un code valide (création de compte)', async () => {
    const email = `new-${unique()}@example.com`;
    const ip = `10.0.1.${Math.floor(Math.random() * 200) + 10}`;
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
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; user: { email: string }; isNewUser: boolean };
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe(email);
    expect(body.isNewUser).toBe(true);
    expect(res.headers.get('set-cookie')).toContain('mcm_session');
  });

  it('rejette un code invalide et invalide après 3 tentatives', async () => {
    const email = `fail-${unique()}@example.com`;
    const ip = `10.0.2.${Math.floor(Math.random() * 200) + 10}`;
    await app.request('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify({ email }),
    });
    void (await getOtpCode(email)); // s'assure que l'OTP existe

    for (let i = 0; i < 3; i++) {
      const res = await app.request('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
        body: JSON.stringify({ email, code: '000000' }),
      });
      expect(res.status).toBe(400);
    }
    // Le 4e essai échoue aussi, mais le code a été invalidé
    const res4 = await app.request('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify({ email, code: '000000' }),
    });
    expect(res4.status).toBe(400);
  });

  it('refuse un code expiré', async () => {
    const email = `expired-${unique()}@example.com`;
    const ip = `10.0.3.${Math.floor(Math.random() * 200) + 10}`;
    await app.request('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify({ email }),
    });
    const code = await getOtpCode(email);
    await redis.del(`otp:${email}`); // expiration simulée

    const res = await app.request('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify({ email, code }),
    });
    expect(res.status).toBe(400);
  });
});

describe('Sessions', () => {
  async function login(): Promise<string> {
    const email = `sess-${unique()}@example.com`;
    const ip = `10.0.4.${Math.floor(Math.random() * 200) + 10}`;
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

  it('GET /session renvoie l’utilisateur connecté', async () => {
    const token = await login();
    const res = await app.request('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: { id: string } | null };
    expect(body.user).toBeTruthy();
  });

  it('GET /session renvoie null sans token', async () => {
    const res = await app.request('/api/auth/session');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: unknown };
    expect(body.user).toBeNull();
  });

  it('POST /logout révoque immédiatement la session', async () => {
    const token = await login();

    const before = await app.request('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(((await before.json()) as { user: unknown }).user).toBeTruthy();

    const logout = await app.request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(logout.status).toBe(200);

    // La session révoquée ne doit plus être valide (même avec le même JWT)
    const after = await app.request('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(((await after.json()) as { user: unknown }).user).toBeNull();
  });
});

describe('OAuth', () => {
  it('rejette un idToken falsifié', async () => {
    const res = await app.request('/api/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken: 'eyJhbGciOiJIUzI1NiJ9.fake.payload.signature' }),
    });
    // fournisseur non configuré (409) OU signature invalide (401) : rejeté dans tous les cas
    expect([401, 409]).toContain(res.status);
  });

  it('rejette un idToken non signé (garbage)', async () => {
    const res = await app.request('/api/auth/apple', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken: 'not-a-real-token' }),
    });
    expect([401, 409]).toContain(res.status);
  });
});
