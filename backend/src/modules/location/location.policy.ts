export type LocationVisibility = 'nobody' | 'friends' | 'friends_of_friends' | 'nearby' | 'everyone';

export function canDiscoverUser(visibility: LocationVisibility, isFriend: boolean, isFriendOfFriend: boolean): boolean {
  if (visibility === 'nobody') return false;
  if (visibility === 'friends') return isFriend;
  if (visibility === 'friends_of_friends') return isFriend || isFriendOfFriend;
  return true;
}

export function shouldHideLocation(input: { sharingEnabled: boolean; ghostMode: boolean; expiresAt: Date | null }, now = Date.now()): boolean {
  if (!input.sharingEnabled || input.ghostMode) return true;
  return Boolean(input.expiresAt && input.expiresAt.getTime() <= now);
}

export type AudienceMode = 'default' | 'selected' | 'except';

/**
 * Qui peut voir la position de `owner` sur la carte.
 * - `nobody` ne montre jamais rien, quelle que soit l'audience ;
 * - `selected` : uniquement les compagnons figurant dans la liste ;
 * - `except` : la visibilité habituelle, sauf les personnes de la liste ;
 * - `default` : la visibilité habituelle.
 */
export function canSeeLocation(input: { visibility: LocationVisibility; mode: AudienceMode; listed: boolean; isFriend: boolean; isFriendOfFriend: boolean }): boolean {
  if (input.visibility === 'nobody') return false;
  // La liste ne vaut que tant que la relation existe : une personne listée puis retirée des compagnons
  // (ou bloquée) ne doit jamais conserver un accès périmé.
  if (input.mode === 'selected') return input.listed && input.isFriend;
  const base = canDiscoverUser(input.visibility, input.isFriend, input.isFriendOfFriend);
  if (input.mode === 'except') return base && !input.listed;
  return base;
}

/**
 * Opt-in explicite : activer le partage de position (passer de « désactivé » à « activé ») exige un
 * consentement donné dans la même requête. Mettre à jour ses coordonnées alors que le partage est déjà
 * actif, ou le désactiver, n'en demande pas.
 */
export function requiresConsent(input: { currentlyEnabled: boolean; wantsEnabled: boolean; consent: boolean }): boolean {
  return input.wantsEnabled && !input.currentlyEnabled && !input.consent;
}

export interface ReachInput {
  sharingEnabled: boolean;
  ghostMode: boolean;
  expiresAt: Date | null;
  visibility: LocationVisibility;
  mode: AudienceMode;
  friendIds: ReadonlySet<string>;
  friendOfFriendIds: ReadonlySet<string>;
  listedIds: ReadonlySet<string>;
}

export interface Reach {
  /** Personnes identifiées qui peuvent voir la position (compagnons, amis d'amis). */
  count: number;
  friends: number;
  friendsOfFriends: number;
  /** Plus large audience : `nearby` / `everyone` ajoutent des inconnus qui ne sont pas dénombrables ici. */
  scope: 'none' | 'friends' | 'friends_of_friends' | 'nearby' | 'everyone';
  /** Vrai quand des personnes non identifiées (hors compagnons et amis d'amis) peuvent aussi la voir. */
  openToStrangers: boolean;
}

/** « Partagé avec N » : applique exactement les mêmes règles que `canSeeLocation` à chaque personne connue. */
export function computeReach(input: ReachInput, now = Date.now()): Reach {
  if (shouldHideLocation({ sharingEnabled: input.sharingEnabled, ghostMode: input.ghostMode, expiresAt: input.expiresAt }, now) || input.visibility === 'nobody') {
    return { count: 0, friends: 0, friendsOfFriends: 0, scope: 'none', openToStrangers: false };
  }
  let friends = 0;
  let friendsOfFriends = 0;
  for (const id of input.friendIds) {
    if (canSeeLocation({ visibility: input.visibility, mode: input.mode, listed: input.listedIds.has(id), isFriend: true, isFriendOfFriend: false })) friends += 1;
  }
  for (const id of input.friendOfFriendIds) {
    if (input.friendIds.has(id)) continue;
    if (canSeeLocation({ visibility: input.visibility, mode: input.mode, listed: input.listedIds.has(id), isFriend: false, isFriendOfFriend: true })) friendsOfFriends += 1;
  }
  const open = input.mode !== 'selected' && (input.visibility === 'nearby' || input.visibility === 'everyone');
  return { count: friends + friendsOfFriends, friends, friendsOfFriends, scope: input.visibility, openToStrangers: open };
}
