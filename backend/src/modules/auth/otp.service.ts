import { randomInt } from 'node:crypto';
import { redis } from '../../infrastructure/redis';

// ── Constantes OTP ─────────────────────────────────────────
export const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_SEND_PER_EMAIL_HOUR = 3;
export const OTP_SEND_PER_IP_HOUR = 10;
const HOUR = 60 * 60;

// ── Clés Redis ─────────────────────────────────────────────
const otpKey = (email: string) => `otp:${email}`;
const sendEmailKey = (email: string) => `otp:send:email:${email}`;
const sendIpKey = (ip: string) => `otp:send:ip:${ip}`;

interface OtpRecord {
  code: string;
  attempts: number;
  createdAt: number;
}

/** Génère un code OTP à 6 chiffres (cryptographically secure). */
function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** Crée et stocke un OTP pour un email (remplace l'ancien). */
export async function createOtp(email: string): Promise<{ code: string; cooldownSeconds: number }> {
  const code = generateCode();
  const record: OtpRecord = { code, attempts: 0, createdAt: Date.now() };
  await redis.set(otpKey(email), JSON.stringify(record), 'EX', OTP_TTL_SECONDS);
  return { code, cooldownSeconds: OTP_TTL_SECONDS };
}

/**
 * Vérifie un code OTP.
 * - code correct → supprime la clé, retourne { ok: true }
 * - code faux → incrémente les tentatives ; après 3 échecs, invalide le code
 */
export async function verifyOtp(email: string, code: string): Promise<{ ok: boolean; attemptsLeft?: number }> {
  const raw = await redis.get(otpKey(email));
  if (!raw) return { ok: false, attemptsLeft: 0 };

  const record = JSON.parse(raw) as OtpRecord;

  if (record.code === code) {
    await redis.del(otpKey(email));
    return { ok: true };
  }

  const attempts = record.attempts + 1;
  if (attempts >= OTP_MAX_ATTEMPTS) {
    await redis.del(otpKey(email));
    return { ok: false, attemptsLeft: 0 };
  }

  record.attempts = attempts;
  await redis.set(otpKey(email), JSON.stringify(record), 'EX', OTP_TTL_SECONDS);
  return { ok: false, attemptsLeft: OTP_MAX_ATTEMPTS - attempts };
}

/**
 * Rate limiting anti-spam sur l'envoi d'OTP.
 * - 3 envois / heure / email
 * - 10 envois / heure / IP
 */
export async function checkOtpSendLimit(email: string, ip: string): Promise<{ allowed: boolean; cooldownSeconds?: number }> {
  const emailKey = sendEmailKey(email);
  const ipKey = sendIpKey(ip);

  const emailCount = Number((await redis.get(emailKey)) ?? 0);
  const ipCount = Number((await redis.get(ipKey)) ?? 0);

  if (emailCount >= OTP_SEND_PER_EMAIL_HOUR) {
    const ttl = (await redis.ttl(emailKey)) || HOUR;
    return { allowed: false, cooldownSeconds: ttl };
  }
  if (ipCount >= OTP_SEND_PER_IP_HOUR) {
    const ttl = (await redis.ttl(ipKey)) || HOUR;
    return { allowed: false, cooldownSeconds: ttl };
  }

  // Incrément + TTL 1h (INCR + EXPIRE si clé nouvelle)
  const [newEmail, newIp] = await Promise.all([
    redis.incr(emailKey).then((n) => {
      if (n === 1) return redis.expire(emailKey, HOUR).then(() => n);
      return n;
    }),
    redis.incr(ipKey).then((n) => {
      if (n === 1) return redis.expire(ipKey, HOUR).then(() => n);
      return n;
    }),
  ]);
  void newEmail;
  void newIp;

  return { allowed: true };
}
