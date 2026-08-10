import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app';
import { redis } from '../../src/infrastructure/redis';

const app = createApp();

const unique = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

const MINOR_BIRTHDATE = '2010-01-01';

async function getOtpCode(email: string): Promise<string> {
  const raw = await redis.get(`otp:${email}`);
  if (!raw) throw new Error(`OTP introuvable pour ${email}`);
  return (JSON.parse(raw) as { code: string }).code;
}

interface Session {
  token: string;
  email: string;
}

async function onboardNewUser(overrides: Record<string, unknown> = {}): Promise<Session> {
  const email = `ob-${unique()}@example.com`;
  const ip = `10.20.${Math.floor(Math.random() * 200)}.1`;
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
  const body = (await verify.json()) as { token: string };

  const payload = {
    email,
    name: 'Aïcha',
    username: `aicha${unique()}`,
    avatarSeed: 'aicha-seed',
    gender: 'female',
    seeking: 'friendship',
    birthdate: '1995-06-15',
    roots: { country: 'Bénin', region: 'Atlantique', ethnicity: 'Fon', village: 'Abomey' },
    languages: ['fr', 'fon'],
    intention: 'dating',
    acceptedTermsAt: new Date().toISOString(),
    ...overrides,
  };

  const res = await app.request('/api/onboarding', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${body.token}` },
    body: JSON.stringify(payload),
  });
  expect(res.status).toBe(201);
  return { token: body.token, email };
}

beforeAll(async () => {
  await redis.flushall();
});

afterAll(async () => {
  await redis.flushall();
  await redis.quit();
});

describe('POST /api/onboarding', () => {
  it('complète le profil d’un nouveau compte (201)', async () => {
    const { token } = await onboardNewUser();
    const res = await app.request('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const me = (await res.json()) as { name: string; profileCompleted: boolean };
    expect(me.name).toBe('Aïcha');
    expect(me.profileCompleted).toBe(true);
  });

  it('refuse une seconde soumission (409 ALREADY_ONBOARDED)', async () => {
    const { email, token } = await onboardNewUser();
    const payload = {
      email,
      name: 'Aïcha',
      username: `aicha${unique()}`,
      gender: 'female',
      seeking: 'friendship',
      birthdate: '1995-06-15',
      roots: { country: 'Bénin' },
      languages: ['fr'],
      intention: 'dating',
      acceptedTermsAt: new Date().toISOString(),
    };
    const res = await app.request('/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('ALREADY_ONBOARDED');
  });

  it('refuse un mineur (403 UNDERAGE)', async () => {
    const email = `minor-${unique()}@example.com`;
    const ip = `10.20.${Math.floor(Math.random() * 200)}.3`;
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
        name: 'Jeune',
        username: `jeune${unique()}`,
        gender: 'non-binary',
        seeking: 'friendship',
        birthdate: MINOR_BIRTHDATE,
        roots: { country: 'Bénin' },
        languages: ['fr'],
        intention: 'friendship',
        acceptedTermsAt: new Date().toISOString(),
      }),
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNDERAGE');
  });

  it('refuse un email différent de la session (403 EMAIL_MISMATCH)', async () => {
    const { token } = await onboardNewUser();
    const res = await app.request('/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: `autre-${unique()}@example.com`,
        name: 'Aïcha',
        username: `aicha${unique()}`,
        gender: 'female',
        seeking: 'friendship',
        birthdate: '1995-06-15',
        roots: { country: 'Bénin' },
        languages: ['fr'],
        intention: 'dating',
        acceptedTermsAt: new Date().toISOString(),
      }),
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('EMAIL_MISMATCH');
  });

  it('refuse un username déjà pris (409 + suggestions)', async () => {
    const first = await onboardNewUser();

    // Second compte (email distinct) qui tente de prendre le même username
    const email2 = `ob2-${unique()}@example.com`;
    const ip2 = `10.20.${Math.floor(Math.random() * 200)}.2`;
    await app.request('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip2 },
      body: JSON.stringify({ email: email2 }),
    });
    const code2 = await getOtpCode(email2);
    const verify2 = await app.request('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip2 },
      body: JSON.stringify({ email: email2, code: code2 }),
    });
    const { token: token2 } = (await verify2.json()) as { token: string };

    // Récupère le username du premier compte
    const me = await app.request('/api/users/me', {
      headers: { Authorization: `Bearer ${first.token}` },
    });
    const { username } = (await me.json()) as { username: string };

    const res = await app.request('/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token2}` },
      body: JSON.stringify({
        email: email2,
        name: 'Amadou',
        username,
        gender: 'male',
        seeking: 'friendship',
        birthdate: '1992-03-10',
        roots: { country: 'Sénégal' },
        languages: ['fr'],
        intention: 'friendship',
        acceptedTermsAt: new Date().toISOString(),
      }),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string; details: { suggestions: string[] } } };
    expect(body.error.code).toBe('USERNAME_TAKEN');
    expect(body.error.details.suggestions.length).toBeGreaterThan(0);
  });
});

describe('GET /api/users/:id — profil public', () => {
  it('renvoie le profil sans email', async () => {
    const { token, email } = await onboardNewUser();
    const me = await app.request('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { id } = (await me.json()) as { id: string };

    const res = await app.request('/api/users/' + id, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.id).toBe(id);
    expect(body.email).toBeUndefined();
    expect(email).not.toBe(body.email);
  });

  it('retourne 404 pour un utilisateur inconnu', async () => {
    const { token } = await onboardNewUser();
    const res = await app.request('/api/users/unknown-id-123', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/users/me — mise à jour du profil', () => {
  it('met à jour bio et occupation (200)', async () => {
    const { token } = await onboardNewUser();
    const res = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        bio: 'Passionnée de culture vodun et de cuisine béninoise.',
        occupation: { domain: 'Culture', title: 'Artiste' },
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { bio: string; occupation: { domain: string } };
    expect(body.bio).toBe('Passionnée de culture vodun et de cuisine béninoise.');
    expect(body.occupation.domain).toBe('Culture');
  });

  it('rejette une bio trop courte (400)', async () => {
    const { token } = await onboardNewUser();
    const res = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bio: 'courte' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejette un champ inconnu (400 strict)', async () => {
    const { token } = await onboardNewUser();
    const res = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ hackerField: 'x' }),
    });
    expect(res.status).toBe(400);
  });
});
