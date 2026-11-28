/** Règles Love PURES (sans base, Redis ni env) : âge, éligibilité. */

export const LOVE_MIN_AGE = 18;

/** Âge révolu en années (UTC). null si la date est absente, invalide ou future. */
export function computeAge(birthdate: Date | null | undefined, now: Date = new Date()): number | null {
  if (!birthdate || Number.isNaN(birthdate.getTime())) return null;
  let age = now.getUTCFullYear() - birthdate.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birthdate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birthdate.getUTCDate())) age -= 1;
  return age < 0 ? null : age;
}

/**
 * Seules les personnes majeures utilisent Love : un compte sans date de naissance (ou à la date
 * invalide) n'est PAS considéré majeur, il doit renseigner sa date de naissance d'abord.
 */
export function isAdultForLove(birthdate: Date | null | undefined, now: Date = new Date()): boolean {
  const age = computeAge(birthdate, now);
  return age !== null && age >= LOVE_MIN_AGE;
}

export interface FieldAccessLike { profile: boolean; photos: boolean; country: boolean }
interface MaskableProfile { avatar?: string | null; bio?: string | null; country?: string | null; region?: string | null; location?: string | null }

/**
 * Applique les préférences de visibilité de la personne montrée : pays masqué (donc aussi sa région et sa
 * localisation), photo masquée (avatar), profil masqué (bio). À appliquer AVANT le filtrage et le score
 * pour que ni un filtre, ni un classement, ne trahisse une donnée masquée.
 */
export function maskForViewer<T extends MaskableProfile>(row: T, access: FieldAccessLike): T {
  const out = { ...row };
  if (!access.country) { if ('country' in out) out.country = null; if ('region' in out) out.region = null; if ('location' in out) out.location = null; }
  if (!access.photos && 'avatar' in out) out.avatar = null;
  if (!access.profile && 'bio' in out) out.bio = null;
  return out;
}
