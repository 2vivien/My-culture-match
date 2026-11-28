export type ConsentVisibility = 'nobody' | 'friends' | 'friends_of_friends' | 'nearby' | 'everyone';

export function visibilityAllows(value: string, flags: { friend: boolean; fof: boolean; nearby: boolean }): boolean {
  switch (value) {
    case 'nobody': return false;
    case 'friends': return flags.friend;
    case 'friends_of_friends': return flags.friend || flags.fof;
    case 'nearby': return flags.nearby;
    case 'everyone': return true;
    default: return false;
  }
}

export interface FieldVisibilitySettings { profileVisibility: string; photosVisibility: string; countryVisibility: string }
export interface FieldAccess { profile: boolean; photos: boolean; country: boolean }
export type RelationFlags = { friend: boolean; fof: boolean; nearby: boolean };

/** Champs (profil, photos, pays) qu'un lecteur a le droit de voir chez une personne, selon ses préférences et sa relation. */
export function fieldAccess(settings: FieldVisibilitySettings, flags: RelationFlags): FieldAccess {
  return {
    profile: visibilityAllows(settings.profileVisibility, flags),
    photos: visibilityAllows(settings.photosVisibility, flags),
    country: visibilityAllows(settings.countryVisibility, flags),
  };
}

/**
 * Relation d'un lecteur avec plusieurs personnes à partir de données déjà lues (même règle que relationFlags) :
 * un compagnon est aussi ami d'ami mais jamais proche ; sans compagnon, personne n'est ami d'ami.
 */
export function relationFlagsFor(targetId: string, input: { friends: ReadonlySet<string>; friendsOfFriends: ReadonlySet<string>; nearby: ReadonlySet<string> }): RelationFlags {
  if (input.friends.has(targetId)) return { friend: true, fof: true, nearby: false };
  return { friend: false, fof: input.friends.size > 0 && input.friendsOfFriends.has(targetId), nearby: input.nearby.has(targetId) };
}
