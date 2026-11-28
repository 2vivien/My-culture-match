/**
 * Succession des tribus d'un compte supprimé (logique PURE, sans base).
 *
 * `tribes.created_by_id` est en ON DELETE CASCADE : supprimer le compte du créateur supprime la tribu, et
 * `posts.tribe_id` passe alors à NULL (SET NULL). Or `tribeId IS NULL` signifie « lisible par tous » :
 * les posts des autres membres d'une tribu privée deviendraient publics. On transfère donc la propriété
 * avant la suppression, et à défaut on retire les posts de la tribu.
 */
export type SuccessionRole = 'member' | 'moderator' | 'owner';

export interface SuccessionMember {
  userId: string;
  role: SuccessionRole;
  joinedAt: Date;
}

export interface TribeSuccessionPlan {
  /** Nouveau propriétaire, ou null si personne ne peut reprendre la tribu. */
  successorId: string | null;
  /** Les posts de la tribu sont marqués supprimés (jamais laissés orphelins, donc publics). */
  hidePosts: boolean;
}

const ROLE_RANK: Record<SuccessionRole, number> = { owner: 0, moderator: 1, member: 2 };

/**
 * Successeur : un autre propriétaire éventuel, sinon le plus ancien modérateur, sinon le plus ancien membre.
 * Égalité d'ancienneté : identifiant le plus petit (résultat déterministe).
 */
export function chooseTribeSuccessor(leavingUserId: string, members: readonly SuccessionMember[]): string | null {
  const candidates = members.filter((m) => m.userId !== leavingUserId);
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) =>
    ROLE_RANK[a.role] - ROLE_RANK[b.role]
    || a.joinedAt.getTime() - b.joinedAt.getTime()
    || (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0),
  );
  return sorted[0]!.userId;
}

export function planTribeSuccession(leavingUserId: string, members: readonly SuccessionMember[]): TribeSuccessionPlan {
  const successorId = chooseTribeSuccessor(leavingUserId, members);
  return { successorId, hidePosts: successorId === null };
}
