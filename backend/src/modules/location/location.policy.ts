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
 * - `selected` : uniquement les personnes de la liste ;
 * - `except` : la visibilité habituelle, sauf les personnes de la liste ;
 * - `default` : la visibilité habituelle.
 */
export function canSeeLocation(input: { visibility: LocationVisibility; mode: AudienceMode; listed: boolean; isFriend: boolean; isFriendOfFriend: boolean }): boolean {
  if (input.visibility === 'nobody') return false;
  if (input.mode === 'selected') return input.listed;
  const base = canDiscoverUser(input.visibility, input.isFriend, input.isFriendOfFriend);
  if (input.mode === 'except') return base && !input.listed;
  return base;
}
