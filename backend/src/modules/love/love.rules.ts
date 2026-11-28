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
