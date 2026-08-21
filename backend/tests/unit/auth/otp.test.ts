import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { redis } from '../../../src/infrastructure/redis';
import {
  createOtp,
  verifyOtp,
  checkOtpSendLimit,
  OTP_TTL_SECONDS,
  OTP_MAX_ATTEMPTS,
  OTP_SEND_PER_EMAIL_HOUR,
  OTP_SEND_PER_IP_HOUR,
} from '../../../src/modules/auth/otp.service';

let counter = 0;
const email = () => `unit-otp-${Date.now()}-${counter++}@test.local`;

async function flush(email: string, ip: string): Promise<void> {
  await redis.del(`otp:${email}`, `otp:send:email:${email}`, `otp:send:ip:${ip}`);
}

describe('OTP — création & vérification', () => {
  beforeEach(() => {
    // On n'utilise que des clés aléatoires, aucune purge globale nécessaire.
  });

  afterEach(async () => {
    await flush('__never__', '__never__');
  });

  it('crée un code à 6 chiffres avec cooldown = TTL', async () => {
    const e = email();
    const { code, cooldownSeconds } = await createOtp(e);
    expect(code).toMatch(/^\d{6}$/);
    expect(cooldownSeconds).toBe(OTP_TTL_SECONDS);
    const ttl = await redis.ttl(`otp:${e}`);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(OTP_TTL_SECONDS);
    await redis.del(`otp:${e}`);
  });

  it('valide le bon code puis supprime la clé', async () => {
    const e = email();
    const { code } = await createOtp(e);
    const result = await verifyOtp(e, code);
    expect(result.ok).toBe(true);
    expect(await redis.exists(`otp:${e}`)).toBe(0);
  });

  it('consomme les tentatives puis invalide après OTP_MAX_ATTEMPTS échecs', async () => {
    const e = email();
    const { code } = await createOtp(e);
    const wrong = code === '000000' ? '111111' : '000000';

    const r1 = await verifyOtp(e, wrong);
    expect(r1.ok).toBe(false);
    expect(r1.attemptsLeft).toBe(OTP_MAX_ATTEMPTS - 1);

    const r2 = await verifyOtp(e, wrong);
    expect(r2.attemptsLeft).toBe(OTP_MAX_ATTEMPTS - 2);

    const r3 = await verifyOtp(e, wrong);
    expect(r3.ok).toBe(false);
    expect(r3.attemptsLeft).toBe(0);
    // Clé invalidée : plus aucune tentative possible
    const r4 = await verifyOtp(e, wrong);
    expect(r4.attemptsLeft).toBe(0);
  });

  it('ne valide pas un code pour un email sans OTP', async () => {
    const r = await verifyOtp('inexistant@test.local', '000000');
    expect(r.ok).toBe(false);
    expect(r.attemptsLeft).toBe(0);
  });
});

describe('OTP — rate limiting', () => {
  it('bloque le 4e envoi pour le même email (3/heure)', async () => {
    const e = email();
    const ip = `10.99.${counter}.${counter}`;
    for (let i = 0; i < OTP_SEND_PER_EMAIL_HOUR; i++) {
      const r = await checkOtpSendLimit(e, ip);
      expect(r.allowed).toBe(true);
    }
    const blocked = await checkOtpSendLimit(e, ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.cooldownSeconds).toBeGreaterThan(0);
    await flush(e, ip);
  });

  it('bloque après 10 envois pour la même IP', async () => {
    const ip = `10.98.${counter}.${counter}`;
    for (let i = 0; i < OTP_SEND_PER_IP_HOUR; i++) {
      const r = await checkOtpSendLimit(email(), ip);
      expect(r.allowed).toBe(true);
    }
    const blocked = await checkOtpSendLimit(email(), ip);
    expect(blocked.allowed).toBe(false);
    await redis.del(`otp:send:ip:${ip}`);
  });

  it('bloque à l’échelle de l’IP, pas de l’email', async () => {
    const ip1 = `10.97.${counter}.${counter}`;
    const ip2 = `10.96.${counter}.${counter}`;
    for (let i = 0; i < OTP_SEND_PER_IP_HOUR; i++) {
      await checkOtpSendLimit(email(), ip1);
    }
    // IP1 saturée même pour un nouvel email → bloqué
    expect((await checkOtpSendLimit(email(), ip1)).allowed).toBe(false);
    // IP2 n'a jamais envoyé → autorisé pour le même email
    expect((await checkOtpSendLimit(email(), ip2)).allowed).toBe(true);
    await redis.del(`otp:send:ip:${ip1}`, `otp:send:ip:${ip2}`);
  });
});
