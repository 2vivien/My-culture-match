/** Règles pures de sanction de tribu (sans accès base) : testables unitairement. */
export type TribeRole = 'member' | 'moderator' | 'owner';
export type SanctionKind = 'ban' | 'mute';

/**
 * Qui peut sanctionner qui :
 * - jamais soi-même, jamais l'owner ;
 * - un modérateur sanctionne les membres ;
 * - l'owner sanctionne membres et modérateurs ;
 * - la cible peut ne plus être membre (ban d'un ancien membre) : traitée comme `member`.
 */
export function canSanction(actorRole: TribeRole | null, targetRole: TribeRole | null, actorId: string, targetId: string): boolean {
  if (actorId === targetId) return false;
  if (targetRole === 'owner') return false;
  if (actorRole === 'owner') return true;
  if (actorRole === 'moderator') return targetRole === null || targetRole === 'member';
  return false;
}

/** Une sanction sans date d'expiration est permanente. */
export function isSanctionActive(expiresAt: Date | null, now = Date.now()): boolean {
  return expiresAt === null || expiresAt.getTime() > now;
}

/** Une personne mutée ou bannie ne peut ni publier ni commenter dans la tribu. */
export function blocksWriting(kind: SanctionKind): boolean {
  return kind === 'ban' || kind === 'mute';
}

/** Un bannissement empêche aussi de rejoindre ou de rester membre. */
export function blocksMembership(kind: SanctionKind): boolean {
  return kind === 'ban';
}

export function expiryFromDays(days: number | undefined, now = Date.now()): Date | null {
  if (days === undefined) return null;
  return new Date(now + days * 24 * 60 * 60 * 1000);
}
