import { describe, expect, it } from 'vitest';
import { visibilityAllows } from '../../../src/modules/consent/consent.policy';

describe('consent visibility policy', () => {
  const friend = { friend: true, fof: true, nearby: false };
  const fof = { friend: false, fof: true, nearby: false };
  const nearby = { friend: false, fof: false, nearby: true };
  const stranger = { friend: false, fof: false, nearby: false };
  it('keeps nobody private', () => expect(visibilityAllows('nobody', friend)).toBe(false));
  it('allows friends only to direct friends', () => { expect(visibilityAllows('friends', friend)).toBe(true); expect(visibilityAllows('friends', fof)).toBe(false); });
  it('allows friends of friends without opening to strangers', () => { expect(visibilityAllows('friends_of_friends', friend)).toBe(true); expect(visibilityAllows('friends_of_friends', fof)).toBe(true); expect(visibilityAllows('friends_of_friends', stranger)).toBe(false); });
  it('supports nearby and everyone independently', () => { expect(visibilityAllows('nearby', nearby)).toBe(true); expect(visibilityAllows('nearby', stranger)).toBe(false); expect(visibilityAllows('everyone', stranger)).toBe(true); });
});

import { fieldAccess, relationFlagsFor } from '../../../src/modules/consent/consent.policy';

describe('fieldAccess', () => {
  const settings = { profileVisibility: 'everyone', photosVisibility: 'friends', countryVisibility: 'nobody' };
  it('applique chaque champ séparément', () => {
    expect(fieldAccess(settings, { friend: false, fof: false, nearby: false })).toEqual({ profile: true, photos: false, country: false });
    expect(fieldAccess(settings, { friend: true, fof: true, nearby: false })).toEqual({ profile: true, photos: true, country: false });
  });
});

describe('relationFlagsFor', () => {
  const sets = { friends: new Set(['f']), friendsOfFriends: new Set(['g']), nearby: new Set(['n']) };
  it('compagnon : ami et ami d’ami, jamais proche', () => expect(relationFlagsFor('f', sets)).toEqual({ friend: true, fof: true, nearby: false }));
  it('ami d’ami et proche', () => { expect(relationFlagsFor('g', sets)).toEqual({ friend: false, fof: true, nearby: false }); expect(relationFlagsFor('n', sets).nearby).toBe(true); });
  it('sans compagnon, personne n’est ami d’ami', () => expect(relationFlagsFor('g', { ...sets, friends: new Set() }).fof).toBe(false));
});
