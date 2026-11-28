import { describe, expect, it } from 'vitest';
import { loveProfileSchema, profileSearchDefaults } from '../../../src/modules/love/love.profile';

const valid = {
  goals: ['serious'],
  relationship: 'serious',
  values: ['respect', 'honesty', 'family'],
  lifestyle: ['travel', 'music', 'sport', 'cooking', 'reading'],
  distance: 'km50',
  understood: 'Quand on prend le temps de m’écouter.',
} as const;

describe('loveProfileSchema', () => {
  it('accepte un questionnaire complet', () => {
    expect(loveProfileSchema.safeParse(valid).success).toBe(true);
  });

  it('la question libre est facultative', () => {
    const { understood: _omit, ...rest } = valid;
    expect(loveProfileSchema.safeParse(rest).success).toBe(true);
  });

  it('exige 3 à 5 valeurs et 5 à 8 centres d’intérêt', () => {
    expect(loveProfileSchema.safeParse({ ...valid, values: ['respect', 'honesty'] }).success).toBe(false);
    expect(loveProfileSchema.safeParse({ ...valid, values: ['respect', 'honesty', 'family', 'humor', 'freedom', 'ambition'] }).success).toBe(false);
    expect(loveProfileSchema.safeParse({ ...valid, lifestyle: ['travel', 'music'] }).success).toBe(false);
  });

  it('refuse les doublons, les valeurs hors vocabulaire et les champs inconnus', () => {
    expect(loveProfileSchema.safeParse({ ...valid, values: ['respect', 'respect', 'honesty'] }).success).toBe(false);
    expect(loveProfileSchema.safeParse({ ...valid, values: ['respect', 'honesty', 'astrologie'] }).success).toBe(false);
    expect(loveProfileSchema.safeParse({ ...valid, religion: 'x' }).success).toBe(false);
  });

  it('limite la réponse libre à 500 caractères', () => {
    expect(loveProfileSchema.safeParse({ ...valid, understood: 'a'.repeat(501) }).success).toBe(false);
  });
});

describe('profileSearchDefaults', () => {
  const parse = (over: object) => loveProfileSchema.parse({ ...valid, ...over });

  it('traduit l’objectif relationnel en critère de recherche', () => {
    expect(profileSearchDefaults(parse({ relationship: 'serious' })).relationshipGoal).toBe('serious');
    expect(profileSearchDefaults(parse({ relationship: 'casual' })).relationshipGoal).toBe('casual');
    expect(profileSearchDefaults(parse({ relationship: 'slow' })).relationshipGoal).toBe('open');
    expect(profileSearchDefaults(parse({ relationship: 'unsure' })).relationshipGoal).toBe('open');
  });

  it('convertit la distance en km, et n’en pose aucune pour pays / international', () => {
    expect(profileSearchDefaults(parse({ distance: 'km25' })).distanceKm).toBe(25);
    expect(profileSearchDefaults(parse({ distance: 'country' })).distanceKm).toBeUndefined();
    expect(profileSearchDefaults(parse({ distance: 'international' }))).not.toHaveProperty('distanceKm');
  });
});
