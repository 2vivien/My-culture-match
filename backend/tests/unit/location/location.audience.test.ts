import { describe, expect, it } from 'vitest';
import { canSeeLocation } from '../../../src/modules/location/location.policy';

const base = { visibility: 'friends' as const, mode: 'default' as const, listed: false, isFriend: true, isFriendOfFriend: false };

describe('canSeeLocation — mode par défaut', () => {
  it('applique la visibilité habituelle', () => {
    expect(canSeeLocation(base)).toBe(true);
    expect(canSeeLocation({ ...base, isFriend: false })).toBe(false);
    expect(canSeeLocation({ ...base, visibility: 'everyone', isFriend: false })).toBe(true);
  });

  it('« personne » ne montre jamais rien', () => {
    expect(canSeeLocation({ ...base, visibility: 'nobody' })).toBe(false);
  });
});

describe('canSeeLocation — sélection (« ces personnes seulement »)', () => {
  it('seules les personnes listées voient la position, même sans visibilité large', () => {
    const selected = { ...base, mode: 'selected' as const, visibility: 'friends' as const };
    expect(canSeeLocation({ ...selected, listed: true })).toBe(true);
    expect(canSeeLocation({ ...selected, listed: false })).toBe(false);
  });

  it('un compagnon non listé ne voit rien', () => {
    expect(canSeeLocation({ ...base, mode: 'selected', listed: false, isFriend: true })).toBe(false);
  });

  it('« personne » reste prioritaire sur la liste', () => {
    expect(canSeeLocation({ ...base, mode: 'selected', visibility: 'nobody', listed: true })).toBe(false);
  });
});

describe('canSeeLocation — tous sauf…', () => {
  const except = { ...base, mode: 'except' as const };

  it('exclut les personnes listées', () => {
    expect(canSeeLocation({ ...except, listed: true })).toBe(false);
  });

  it('garde la visibilité habituelle pour les autres', () => {
    expect(canSeeLocation({ ...except, listed: false })).toBe(true);
    expect(canSeeLocation({ ...except, listed: false, isFriend: false })).toBe(false);
  });
});
