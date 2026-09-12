import { randomInt, randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { checkOtpSendLimit, createOtp, verifyOtp } from './otp.service';
import { createSession, revokeSession, verifySession } from './session.service';
import { verifyIdToken, type OAuthProvider } from './oauth.service';
import { sendOtpEmail } from '../email/otp.templates';
import { verifyTotpCode } from '../../shared/utils/totp';
import { detectLocationForUser } from '../../shared/utils/geo';

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Ticket de pré-auth 2FA (valable 5 min, 5 essais max) — la session n'est
// créée qu'après validation du code TOTP.
const TWO_FA_TICKET_TTL = 5 * 60;
const TWO_FA_MAX_ATTEMPTS = 5;
const twoFaTicketKey = (ticket: string) => `auth:2fa:ticket:${ticket}`;

export type LoginResult =
  | { token: string; user: ReturnType<typeof publicUser>; isNewUser: boolean; twoFactorRequired?: false }
  | { twoFactorRequired: true; ticket: string; user: ReturnType<typeof publicUser> };

// ── Helpers ────────────────────────────────────────────────
function generateUsername(email: string): string {
  const base = email.split('@')[0]!.replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 20);
  const suffix = String(randomInt(1000, 9999));
  return `${base || 'user'}${suffix}`;
}

function publicUser(user: { id: string; email: string; name: string; username: string; avatar: string | null; emailVerified: boolean; role: string; bannedAt: Date | null }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
    role: user.role,
    bannedAt: user.bannedAt,
  };
}

async function findUserByEmail(email: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return user ?? null;
}

function assertNotLocked(user: { lockedUntil: Date | null; bannedAt: Date | null }): void {
  if (user.bannedAt) {
    throw AppError.forbidden('Ce compte a été banni pour non-respect des règles.', 'ACCOUNT_BANNED');
  }
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const remainingMin = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw AppError.forbidden(`Compte verrouillé. Réessayez dans ${remainingMin} min.`, 'ACCOUNT_LOCKED');
  }
}

/** Émet un ticket de pré-auth si l'utilisateur a activé la 2FA (pas de session). */
async function maybeRequireTwoFactor(
  user: { id: string; email: string; name: string; username: string; avatar: string | null; emailVerified: boolean; role: string; bannedAt: Date | null; twoFactorEnabled: boolean },
): Promise<LoginResult | null> {
  if (!user.twoFactorEnabled) return null;
  const ticket = randomUUID();
  await redis.set(
    twoFaTicketKey(ticket),
    JSON.stringify({ userId: user.id, attempts: 0 }),
    'EX',
    TWO_FA_TICKET_TTL,
  );
  return { twoFactorRequired: true, ticket, user: publicUser(user) };
}

/** Crée un compte minimal (email, username) — le profil est complété à l'onboarding. */
async function ensureUser(email: string, name?: string) {
  const existing = await findUserByEmail(email);
  if (existing) return { user: existing, isNewUser: false };

  const [user] = await db
    .insert(schema.users)
    .values({
      email,
      emailVerified: true,
      name: name ?? email.split('@')[0] ?? 'Utilisateur',
      username: generateUsername(email),
    })
    .returning();

  return { user: user!, isNewUser: true };
}

// ── API publique ───────────────────────────────────────────

/** POST /send-otp — même réponse que l'email existe ou non (anti-énumération). */
export async function sendOtp(email: string, ip: string): Promise<{ success: true; cooldown: number }> {
  const limit = await checkOtpSendLimit(email, ip);
  if (!limit.allowed) {
    throw AppError.tooMany('Trop d’envois, réessayez plus tard', 'OTP_RATE_LIMITED');
  }

  const existing = await findUserByEmail(email);
  void existing; // même comportement pour email existant / inconnu

  const { code } = await createOtp(email);
  const locale = email.includes('.') ? 'en' : 'fr'; // i18n basique par domaine
  await sendOtpEmail(email, code, locale === 'fr' ? 'fr' : 'en');

  return { success: true, cooldown: 5 * 60 };
}

/** POST /verify-otp — valide le code, gère lock, crée l'utilisateur si besoin, ouvre une session. */
export async function verifyOtpAndLogin(
  email: string,
  code: string,
  meta: { ip?: string; userAgent?: string },
): Promise<LoginResult> {
  const existing = await findUserByEmail(email);
  if (existing) assertNotLocked(existing);

  const otpResult = await verifyOtp(email, code);
  if (!otpResult.ok) {
    // Comptabilise l'échec sur le compte existant uniquement
    if (existing) {
      const attempts = existing.failedLoginAttempts + 1;
      const lock = attempts >= LOCK_THRESHOLD ? new Date(Date.now() + LOCK_DURATION_MS) : null;
      await db
        .update(schema.users)
        .set({ failedLoginAttempts: lock ? 0 : attempts, lockedUntil: lock, updatedAt: new Date() })
        .where(eq(schema.users.id, existing.id));
    }
    if (otpResult.attemptsLeft === 0) {
      throw AppError.badRequest('Code invalide. Demandez un nouveau code.', 'OTP_INVALID');
    }
    throw AppError.badRequest(
      `Code invalide. Il vous reste ${otpResult.attemptsLeft} tentative(s).`,
      'OTP_INVALID',
    );
  }

  const { user, isNewUser } = await ensureUser(email);

  await db
    .update(schema.users)
    .set({ failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));

  // Détection silencieuse de la localisation par IP (pré-remplissage, non bloquant)
  void detectLocationForUser(user.id, meta.ip);

  // 2FA activée → pré-auth (ticket) en attendant le code TOTP
  const twoFactor = await maybeRequireTwoFactor(user);
  if (twoFactor) return twoFactor;

  const token = await createSession(user.id, meta);
  return { token, user: publicUser(user), isNewUser };
}

/** POST /auth/2fa/verify — valide le code TOTP du ticket et ouvre la session. */
export async function verifyTwoFactorLogin(
  ticket: string,
  code: string,
  meta: { ip?: string; userAgent?: string },
): Promise<{ token: string; user: ReturnType<typeof publicUser>; isNewUser: false }> {
  const raw = await redis.get(twoFaTicketKey(ticket));
  if (!raw) throw AppError.badRequest('Session de double authentification expirée. Recommencez.', 'TWO_FACTOR_TICKET_EXPIRED');

  const record = JSON.parse(raw) as { userId: string; attempts: number };
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, record.userId)).limit(1);
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    await redis.del(twoFaTicketKey(ticket));
    throw AppError.badRequest('Double authentification inactive. Réessayez.', 'TWO_FACTOR_NOT_ENABLED');
  }

  if (!verifyTotpCode(user.twoFactorSecret, code)) {
    const attempts = record.attempts + 1;
    if (attempts >= TWO_FA_MAX_ATTEMPTS) {
      await redis.del(twoFaTicketKey(ticket));
      throw AppError.badRequest('Trop de tentatives. Recommencez la connexion.', 'TWO_FACTOR_EXHAUSTED');
    }
    await redis.set(twoFaTicketKey(ticket), JSON.stringify({ userId: user.id, attempts }), 'EX', TWO_FA_TICKET_TTL);
    throw AppError.badRequest(`Code de double authentification invalide (${TWO_FA_MAX_ATTEMPTS - attempts} essai(s) restant).`, 'TWO_FACTOR_CODE_INVALID');
  }

  await redis.del(twoFaTicketKey(ticket));
  await db.update(schema.users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(schema.users.id, user.id));
  const token = await createSession(user.id, meta);
  return { token, user: publicUser(user), isNewUser: false };
}

/** POST /google | /apple — vérifie le idToken et connecte le compte. */
export async function loginWithOAuth(
  provider: OAuthProvider,
  idToken: string,
  meta: { ip?: string; userAgent?: string },
): Promise<LoginResult> {
  const claims = await verifyIdToken(provider, idToken);

  if (!claims.emailVerified) {
    throw AppError.forbidden(
      'Votre adresse e-mail n\'est pas vérifiée chez votre fournisseur d\'authentification. Vérifiez-la avant de vous connecter.',
      'OAUTH_EMAIL_NOT_VERIFIED',
    );
  }

  const existing = await findUserByEmail(claims.email);
  if (existing) assertNotLocked(existing);

  // Lien OAuth (google/apple) si absent
  const [oauthLink] = await db
    .select({ id: schema.userOAuthAccounts.id })
    .from(schema.userOAuthAccounts)
    .where(and(
      eq(schema.userOAuthAccounts.provider, provider),
      eq(schema.userOAuthAccounts.providerAccountId, claims.sub),
    ))
    .limit(1);

  if (!oauthLink) {
    const { user, isNewUser } = await ensureUser(claims.email, claims.name);
    // Détection silencieuse de la localisation par IP (pré-remplissage, non bloquant)
    void detectLocationForUser(user.id, meta.ip);
    await db.insert(schema.userOAuthAccounts).values({
      userId: user.id,
      provider,
      providerAccountId: claims.sub,
      email: claims.email,
    });
    await db
      .update(schema.users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));
    const twoFactor = await maybeRequireTwoFactor(user);
    if (twoFactor) return twoFactor;
    const token = await createSession(user.id, meta);
    return { token, user: publicUser(user), isNewUser };
  }

  // Compte OAuth connu → on lie à l'email s'il existe déjà un compte email
  const { user } = await ensureUser(claims.email, claims.name);
  await db
    .update(schema.users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));
  const twoFactor = await maybeRequireTwoFactor(user);
  if (twoFactor) return twoFactor;
  const token = await createSession(user.id, meta);
  return { token, user: publicUser(user), isNewUser: false };
}

/** POST /logout — révoque immédiatement la session. */
export async function logout(token: string): Promise<{ success: true }> {
  await revokeSession(token);
  return { success: true };
}

/** GET /session — retourne l'utilisateur si le token/cookie est valide. */
export async function getSession(token: string | null) {
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, payload.sub))
    .limit(1);
  if (!user) return null;

  return { user: publicUser(user), token };
}
