import { eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { rateLimitHit } from '../../shared/utils/rate-limit';
import { buildOtpauthUri, generateTotpSecret, verifyTotpCode } from '../../shared/utils/totp';
import { recordAudit } from '../audit/audit.service';
import { createOtp, verifyOtp, checkOtpSendLimit, OTP_TTL_SECONDS } from '../auth/otp.service';
import { sendEmailChangeEmail } from '../email/otp.templates';
import type { SettingsPatchInput } from './settings.schemas';
import QRCode from 'qrcode';

export const SETTINGS_PUT_PER_HOUR = 5;

export interface UserSettingsResult {
  email: string | null;
  gender: string | null;
  locationType: string;
  googleConnected: boolean;
  appleConnected: boolean;
  twoFactor: boolean;
  theme: string;
  language: string;
  notificationsEnabled: boolean;
  updatedAt: string;
}

const EMAIL_CHANGE_KEY = (email: string) => `settings:email-change:${email}`;

function toResult(row: schema.UserSettingsRow): UserSettingsResult {
  return {
    email: row.email,
    gender: row.gender,
    locationType: row.locationType,
    googleConnected: row.googleConnected,
    appleConnected: row.appleConnected,
    twoFactor: row.twoFactor,
    theme: row.theme,
    language: row.language,
    notificationsEnabled: row.notificationsEnabled,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getSettingsRow(userId: string): Promise<schema.UserSettingsRow> {
  const [row] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId)).limit(1);
  if (row) return row;

  const [created] = await db
    .insert(schema.userSettings)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  const [reRead] = await db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId)).limit(1);
  if (!reRead) throw AppError.notFound('Paramètres introuvables', 'SETTINGS_NOT_FOUND');
  return reRead;
}

/** GET /api/settings. */
export async function getSettings(userId: string): Promise<UserSettingsResult> {
  const row = await getSettingsRow(userId);
  return toResult(row);
}

/** PUT /api/settings — rate limit 5/heure/utilisateur. */
export async function updateSettings(
  userId: string,
  patch: SettingsPatchInput,
): Promise<UserSettingsResult> {
  const limit = await rateLimitHit(`settings:put:${userId}`, SETTINGS_PUT_PER_HOUR, 60 * 60);
  if (!limit.allowed) {
    throw AppError.tooMany(`Limite de ${SETTINGS_PUT_PER_HOUR} modifications/heure atteinte`, 'SETTINGS_RATE_LIMITED');
  }

  await db
    .insert(schema.userSettings)
    .values({ userId, ...patch, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.userSettings.userId, set: { ...patch, updatedAt: new Date() } });

  const row = await getSettingsRow(userId);
  return toResult(row);
}

// ── 2FA TOTP ───────────────────────────────────────────────
export interface TwoFactorStartResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

/** POST /api/settings/2fa/start — génère un secret TOTP + QR code. */
export async function startTwoFactor(userId: string, email: string): Promise<TwoFactorStartResult> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
  if (user.twoFactorEnabled) {
    throw AppError.conflict('La double authentification est déjà activée', 'TWO_FACTOR_ALREADY_ENABLED');
  }

  const secret = generateTotpSecret();
  await db.update(schema.users).set({ twoFactorSecret: secret, updatedAt: new Date() }).where(eq(schema.users.id, userId));

  const otpauthUrl = buildOtpauthUri(secret, email ?? user.email ?? userId);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 256 });
  return { secret, otpauthUrl, qrCodeDataUrl };
}

/** POST /api/settings/2fa/verify — valide le code et active la 2FA. */
export async function verifyTwoFactor(
  userId: string,
  code: string,
  context: { ipAddress?: string; userAgent?: string } = {},
): Promise<UserSettingsResult> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
  if (!user.twoFactorSecret) throw AppError.badRequest('Lancez d’abord la génération du secret', 'TWO_FACTOR_NOT_STARTED');
  if (!verifyTotpCode(user.twoFactorSecret, code)) {
    throw AppError.badRequest('Code de double authentification invalide', 'TWO_FACTOR_CODE_INVALID');
  }

  await db.update(schema.users).set({ twoFactorEnabled: true, updatedAt: new Date() }).where(eq(schema.users.id, userId));
  await db
    .insert(schema.userSettings)
    .values({ userId, twoFactor: true, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.userSettings.userId, set: { twoFactor: true, updatedAt: new Date() } });

  await recordAudit(userId, 'two_factor_enabled', {}, context);
  return getSettings(userId);
}

/** POST /api/settings/2fa/disable — désactive la 2FA après vérification du code. */
export async function disableTwoFactor(
  userId: string,
  code: string,
  context: { ipAddress?: string; userAgent?: string } = {},
): Promise<UserSettingsResult> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw AppError.badRequest('La double authentification n’est pas activée', 'TWO_FACTOR_NOT_ENABLED');
  }
  if (!verifyTotpCode(user.twoFactorSecret, code)) {
    throw AppError.badRequest('Code de double authentification invalide', 'TWO_FACTOR_CODE_INVALID');
  }

  await db.update(schema.users).set({ twoFactorEnabled: false, updatedAt: new Date() }).where(eq(schema.users.id, userId));
  await db
    .insert(schema.userSettings)
    .values({ userId, twoFactor: false, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.userSettings.userId, set: { twoFactor: false, updatedAt: new Date() } });

  await recordAudit(userId, 'two_factor_disabled', {}, context);
  return getSettings(userId);
}

// ── Changement d'email ─────────────────────────────────────
/** POST /api/settings/email/request — envoie un code à la nouvelle adresse. */
export async function requestEmailChange(
  userId: string,
  newEmail: string,
  context: { ipAddress?: string; userAgent?: string } = {},
): Promise<{ sentTo: string; expiresInSeconds: number }> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
  if (user.email === newEmail) {
    throw AppError.badRequest('La nouvelle adresse est identique à l’adresse actuelle', 'EMAIL_SAME');
  }
  const [taken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, newEmail)).limit(1);
  if (taken) throw AppError.conflict('Cet email est déjà utilisé', 'EMAIL_TAKEN');

  const ip = context.ipAddress ?? 'unknown';
  const limit = await checkOtpSendLimit(newEmail, ip);
  if (!limit.allowed) {
    throw AppError.tooMany('Trop de demandes, réessayez plus tard', 'EMAIL_CHANGE_RATE_LIMITED');
  }

  const { code } = await createOtp(newEmail);
  await sendEmailChangeEmail(newEmail, code);
  await recordAudit(userId, 'email_change_requested', { newEmail }, context);
  return { sentTo: newEmail, expiresInSeconds: OTP_TTL_SECONDS };
}

/** POST /api/settings/email/change — confirme avec le code et applique. */
export async function confirmEmailChange(
  userId: string,
  newEmail: string,
  code: string,
  context: { ipAddress?: string; userAgent?: string } = {},
): Promise<UserSettingsResult> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
  if (user.email === newEmail) {
    throw AppError.badRequest('La nouvelle adresse est identique à l’adresse actuelle', 'EMAIL_SAME');
  }

  const verified = await verifyOtp(newEmail, code);
  if (!verified.ok) {
    throw AppError.badRequest('Code de confirmation invalide ou expiré', 'EMAIL_CODE_INVALID');
  }

  const [taken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, newEmail)).limit(1);
  if (taken) throw AppError.conflict('Cet email est déjà utilisé', 'EMAIL_TAKEN');

  await db.update(schema.users).set({ email: newEmail, updatedAt: new Date() }).where(eq(schema.users.id, userId));
  await db
    .insert(schema.userSettings)
    .values({ userId, email: newEmail, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.userSettings.userId, set: { email: newEmail, updatedAt: new Date() } });

  await redis.del(EMAIL_CHANGE_KEY(newEmail));
  await recordAudit(userId, 'email_changed', { newEmail }, context);
  return getSettings(userId);
}
