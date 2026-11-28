import { describe, expect, it } from 'vitest';
import { computeMatchScore } from '../../../src/modules/users/match-score';

const a = { values: ['famille', 'tradition', 'musique'], languages: ['fr', 'fon'], country: 'Bénin' };

describe('computeMatchScore', () => {
  it('deux profils identiques valent 100', () => {
    expect(computeMatchScore(a, { ...a })).toBe(100);
  });

  it('aucun point commun sur des profils complets vaut 0', () => {
    expect(computeMatchScore(a, { values: ['sport'], languages: ['en'], country: 'Japon' })).toBe(0);
  });

  it('reste borné entre 0 et 100 et est symétrique', () => {
    const b = { values: ['famille', 'sport'], languages: ['fr', 'en'], country: 'Bénin' };
    const s = computeMatchScore(a, b);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(100);
    expect(computeMatchScore(b, a)).toBe(s);
  });

  it('plus de valeurs communes donne un meilleur score', () => {
    const base = { languages: ['fr'], country: 'Bénin' };
    const one = computeMatchScore({ ...base, values: ['famille', 'a', 'b'] }, { ...base, values: ['famille', 'c', 'd'] });
    const two = computeMatchScore({ ...base, values: ['famille', 'tradition', 'b'] }, { ...base, values: ['famille', 'tradition', 'd'] });
    expect(two).toBeGreaterThan(one);
  });

  it('ignore la casse et les espaces', () => {
    expect(computeMatchScore({ values: [' Famille '], country: 'BÉNIN' }, { values: ['famille'], country: 'bénin' })).toBe(100);
  });

  it('un profil incomplet n’est pas pénalisé : seules les dimensions renseignées des deux côtés comptent', () => {
    expect(computeMatchScore({ languages: ['fr'] }, { languages: ['fr'], values: ['x'], country: 'Togo' })).toBe(100);
  });

  it('sans aucune dimension comparable le score vaut 0', () => {
    expect(computeMatchScore({}, a)).toBe(0);
    expect(computeMatchScore({ values: [], languages: null, country: '' }, a)).toBe(0);
  });

  it('l’ethnie et la région n’influencent pas le score (données sensibles)', () => {
    const p = { ...a, ethnicity: 'Fon', region: 'Atlantique' } as typeof a;
    const q = { ...a, ethnicity: 'Yoruba', region: 'Lagos' } as typeof a;
    expect(computeMatchScore(p, q)).toBe(computeMatchScore(a, a));
  });
});

import { computeVisibleMatchScore } from '../../../src/modules/users/match-score';

describe('computeVisibleMatchScore (pays masqué)', () => {
  const me = { values: ['a', 'b'], languages: ['fr'], country: 'Bénin' };
  const sameCountry = { values: ['a', 'b'], languages: ['fr'], country: 'Bénin' };
  const otherCountry = { values: ['a', 'b'], languages: ['fr'], country: 'Togo' };

  it('pays visible : la dimension pays compte (mêmes pays > pays différents)', () => {
    expect(computeVisibleMatchScore(me, sameCountry, true)).toBeGreaterThan(computeVisibleMatchScore(me, otherCountry, true));
  });

  it('pays masqué : le score est identique que le pays soit le même ou non, il ne trahit rien', () => {
    expect(computeVisibleMatchScore(me, sameCountry, false)).toBe(computeVisibleMatchScore(me, otherCountry, false));
    expect(computeVisibleMatchScore(me, sameCountry, false)).toBe(computeMatchScore(me, { ...sameCountry, country: null }));
  });
});
