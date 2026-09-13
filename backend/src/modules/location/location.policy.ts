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
