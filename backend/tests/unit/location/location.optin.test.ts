import { describe, expect, it } from 'vitest';
import { computeReach, requiresConsent, type ReachInput } from '../../../src/modules/location/location.policy';

describe('requiresConsent — opt-in explicite', () => {
  it('activer depuis « désactivé » sans consentement est refusé', () => {
    expect(requiresConsent({ currentlyEnabled: false, wantsEnabled: true, consent: false })).toBe(true);
  });

  it('activer avec consentement est accepté', () => {
    expect(requiresConsent({ currentlyEnabled: false, wantsEnabled: true, consent: true })).toBe(false);
  });

  it('mettre à jour ses coordonnées alors que le partage est déjà actif ne redemande rien', () => {
    expect(requiresConsent({ currentlyEnabled: true, wantsEnabled: true, consent: false })).toBe(false);
  });

  it('désactiver n’a jamais besoin de consentement', () => {
    expect(requiresConsent({ currentlyEnabled: true, wantsEnabled: false, consent: false })).toBe(false);
    expect(requiresConsent({ currentlyEnabled: false, wantsEnabled: false, consent: false })).toBe(false);
  });
});

const base: ReachInput = {
  sharingEnabled: true,
  ghostMode: false,
  expiresAt: null,
  visibility: 'friends',
  mode: 'default',
  friendIds: new Set(['a', 'b', 'c']),
  friendOfFriendIds: new Set(['x', 'y']),
  listedIds: new Set(),
};

describe('computeReach — « partagé avec N »', () => {
  it('compagnons uniquement', () => {
    expect(computeReach(base)).toEqual({ count: 3, friends: 3, friendsOfFriends: 0, scope: 'friends', openToStrangers: false });
  });

  it('amis d’amis inclus quand la visibilité le permet', () => {
    expect(computeReach({ ...base, visibility: 'friends_of_friends' })).toMatchObject({ count: 5, friends: 3, friendsOfFriends: 2, openToStrangers: false });
  });

  it('nearby et everyone ajoutent des inconnus non dénombrables', () => {
    expect(computeReach({ ...base, visibility: 'nearby' })).toMatchObject({ count: 5, scope: 'nearby', openToStrangers: true });
    expect(computeReach({ ...base, visibility: 'everyone' })).toMatchObject({ scope: 'everyone', openToStrangers: true });
  });

  it('mode sélection : seules les personnes listées, et jamais d’inconnus', () => {
    const r = computeReach({ ...base, visibility: 'nearby', mode: 'selected', listedIds: new Set(['a', 'x']) });
    expect(r).toMatchObject({ count: 1, friends: 1, friendsOfFriends: 0, openToStrangers: false });
  });

  it('mode « tous sauf » : retire les personnes listées', () => {
    const r = computeReach({ ...base, mode: 'except', listedIds: new Set(['a']) });
    expect(r.friends).toBe(2);
  });

  it('une personne listée qui n’est plus compagnon ne compte pas en mode sélection', () => {
    const r = computeReach({ ...base, mode: 'selected', listedIds: new Set(['ancien-ami']) });
    expect(r.count).toBe(0);
  });

  it('personne, mode fantôme, partage désactivé ou expiré : zéro', () => {
    const zero = { count: 0, friends: 0, friendsOfFriends: 0, scope: 'none', openToStrangers: false };
    expect(computeReach({ ...base, visibility: 'nobody' })).toEqual(zero);
    expect(computeReach({ ...base, ghostMode: true })).toEqual(zero);
    expect(computeReach({ ...base, sharingEnabled: false })).toEqual(zero);
    expect(computeReach({ ...base, expiresAt: new Date(1000) }, 2000)).toEqual(zero);
  });
});
