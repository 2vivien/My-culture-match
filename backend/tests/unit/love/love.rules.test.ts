import { describe, expect, it } from 'vitest';
import { computeAge, isAdultForLove } from '../../../src/modules/love/love.rules';

const now = new Date('2026-06-15T12:00:00Z');

describe('computeAge', () => {
  it('compte les années révolues (anniversaire pas encore atteint)', () => {
    expect(computeAge(new Date('2000-06-16T00:00:00Z'), now)).toBe(25);
    expect(computeAge(new Date('2000-06-15T00:00:00Z'), now)).toBe(26);
    expect(computeAge(new Date('2000-06-14T00:00:00Z'), now)).toBe(26);
  });

  it('retourne null sans date, avec une date invalide ou future', () => {
    expect(computeAge(null, now)).toBeNull();
    expect(computeAge(undefined, now)).toBeNull();
    expect(computeAge(new Date('nope'), now)).toBeNull();
    expect(computeAge(new Date('2030-01-01'), now)).toBeNull();
  });
});

describe('isAdultForLove', () => {
  it('refuse un mineur, y compris la veille des 18 ans', () => {
    expect(isAdultForLove(new Date('2008-06-16T00:00:00Z'), now)).toBe(false);
    expect(isAdultForLove(new Date('2015-01-01T00:00:00Z'), now)).toBe(false);
  });

  it('accepte le jour des 18 ans et au-delà', () => {
    expect(isAdultForLove(new Date('2008-06-15T00:00:00Z'), now)).toBe(true);
    expect(isAdultForLove(new Date('1990-01-01T00:00:00Z'), now)).toBe(true);
  });

  it('refuse un compte sans date de naissance', () => {
    expect(isAdultForLove(null, now)).toBe(false);
    expect(isAdultForLove(undefined, now)).toBe(false);
  });
});

import { maskForViewer } from '../../../src/modules/love/love.rules';

describe('maskForViewer', () => {
  const row = { id: 'x', avatar: 'a.png', bio: 'bio', country: 'Bénin', region: 'Atlantique', location: 'Cotonou' };
  it('masque pays, région et localisation quand le pays est caché', () => {
    expect(maskForViewer(row, { profile: true, photos: true, country: false })).toEqual({ ...row, country: null, region: null, location: null });
  });
  it('masque l’avatar sans la photo, la bio sans le profil', () => {
    expect(maskForViewer(row, { profile: false, photos: false, country: true })).toEqual({ ...row, avatar: null, bio: null });
  });
  it('ne change rien si tout est visible, et ne mute pas l’entrée', () => {
    const out = maskForViewer(row, { profile: true, photos: true, country: true });
    expect(out).toEqual(row);
    expect(out).not.toBe(row);
  });
  it('n’ajoute pas de champ absent', () => {
    expect(maskForViewer({ id: 'x', avatar: 'a' }, { profile: false, photos: true, country: false })).toEqual({ id: 'x', avatar: 'a' });
  });
});
