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
