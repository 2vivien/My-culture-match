import { describe, it, expect } from 'vitest';
import { buildUserProfileVector } from '../../../src/modules/culture-engine/profile-vector';

const FIXED_DIMS = [
  'hofstede_power_distance',
  'hofstede_individualism',
  'hofstede_masculinity',
  'hofstede_uncertainty_avoidance',
  'hofstede_long_term',
  'hofstede_indulgence',
  'schwartz_conservation',
  'schwartz_openness',
  'schwartz_self_enhancement',
  'schwartz_self_transcendence',
  'bigfive_openness',
  'bigfive_conscientiousness',
  'bigfive_extraversion',
  'bigfive_agreeableness',
  'bigfive_neuroticism',
];

describe('buildUserProfileVector', () => {
  it('inclut les 15 dimensions fixes à 0.5 (V1)', () => {
    const v = buildUserProfileVector({
      roots: {},
      values: [],
      languages: [],
      ethnicity: null,
      country: null,
      region: null,
    });
    for (const dim of FIXED_DIMS) {
      expect(v[dim]).toBe(0.5);
    }
  });

  it('hache les tokens racines / valeurs / langues / localisation', () => {
    const v = buildUserProfileVector({
      roots: { langueMaternelle: 'wolof', paysOrigine: 'senegal' },
      values: ['liberte'],
      languages: ['fr'],
      ethnicity: 'Wolof',
      country: 'SN',
      region: 'Dakar',
    });
    // Clés hashées (numériques) en plus des dimensions fixes
    const hashedKeys = Object.keys(v).filter((k) => !FIXED_DIMS.includes(k));
    expect(hashedKeys.length).toBeGreaterThan(0);
  });

  it('ignore les valeurs de racines non-string', () => {
    const v = buildUserProfileVector({
      roots: { stringOk: 'wolof', number: 42, bool: true },
      values: [],
      languages: [],
      ethnicity: null,
      country: null,
      region: null,
    });
    const hashedKeys = Object.keys(v).filter((k) => !FIXED_DIMS.includes(k));
    expect(hashedKeys.length).toBeGreaterThan(0);
  });

  it('retourne uniquement les dimensions fixes pour un profil vide', () => {
    const v = buildUserProfileVector({
      roots: {},
      values: [],
      languages: [],
      ethnicity: null,
      country: null,
      region: null,
    });
    expect(Object.keys(v).length).toBe(FIXED_DIMS.length);
  });

  it('toutes les valeurs sont des nombres finis', () => {
    const v = buildUserProfileVector({
      roots: { r: 'senegal' },
      values: ['liberte', 'gratitude'],
      languages: ['fr', 'wo'],
      ethnicity: 'Wolof',
      country: 'SN',
      region: 'Dakar',
    });
    for (const value of Object.values(v)) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});
