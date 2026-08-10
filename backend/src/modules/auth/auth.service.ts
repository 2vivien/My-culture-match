import { randomInt } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';
import { checkOtpSendLimit, createOtp, verifyOtp } from './otp.service';
import { createSession, revokeSession, verifySession } from './session.service';
import { verifyIdToken, type OAuthProvider } from './oauth.service';
import { sendOtpEmail } from '../email/otp.templates';

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// ── Helpers ────────────────────────────────────────────────
function generateUsername(email: string): string {
  const base = email.split('@')[0]!.replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 20);
  const suffix = String(randomInt(1000, 9999));
  return `${base || 'user'}${suffix}`;
}

function publicUser(user: { id: string; email: string; name: string; username: string; avatar: string | null; emailVerified: boolean }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
  };
}

async function findUserByEmail(email: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return user ?? null;
}

function assertNotLocked(user: { lockedUntil: Date | null }): void {
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const remainingMin = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw AppError.forbidden(`Compte verrouillé. Réessayez dans ${remainingMin} min.`, 'ACCOUNT_LOCKED');
  }
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
): Promise<{ token: string; user: ReturnType<typeof publicUser>; isNewUser: boolean }> {
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

  const token = await createSession(user.id, meta);
  return { token, user: publicUser(user), isNewUser };
}

/** POST /google | /apple — vérifie le idToken et connecte le compte. */
export async function loginWithOAuth(
  provider: OAuthProvider,
  idToken: string,
  meta: { ip?: string; userAgent?: string },
): Promise<{ token: string; user: ReturnType<typeof publicUser>; isNewUser: boolean }> {
  const claims = await verifyIdToken(provider, idToken);

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
    const token = await createSession(user.id, meta);
    return { token, user: publicUser(user), isNewUser };
  }

  // Compte OAuth connu → on lie à l'email s'il existe déjà un compte email
  const { user } = await ensureUser(claims.email, claims.name);
  await db
    .update(schema.users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));
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
