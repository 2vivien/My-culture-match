import { describe, expect, it } from 'vitest';
import { distanceMeters, isDuplicatePlace, isValidRejectionReason, nextPlaceStatus, normalizePlaceName, PLACE_CATEGORIES } from '../../../src/modules/places/places.policy';
import { listPlacesQuerySchema, proposePlaceSchema } from '../../../src/modules/places/places.schemas';

describe('normalizePlaceName', () => {
  it('ignore la casse, les accents, la ponctuation et les espaces multiples', () => {
    expect(normalizePlaceName('  Marché   Dantokpa !! ')).toBe('marche dantokpa');
    expect(normalizePlaceName('MARCHE dantokpa')).toBe('marche dantokpa');
  });

  it('renvoie une chaîne vide pour un nom sans caractère exploitable', () => {
    expect(normalizePlaceName('?!…')).toBe('');
  });
});

describe('distanceMeters', () => {
  it('vaut 0 pour le même point et ~111 m pour 0,001° de latitude', () => {
    const p = { latitude: 6.37, longitude: 2.39 };
    expect(distanceMeters(p, p)).toBe(0);
    expect(distanceMeters(p, { latitude: 6.371, longitude: 2.39 })).toBeGreaterThan(105);
    expect(distanceMeters(p, { latitude: 6.371, longitude: 2.39 })).toBeLessThan(117);
  });
});

describe('isDuplicatePlace', () => {
  const existing = [{ name: 'Marché Dantokpa', latitude: 6.3703, longitude: 2.4325 }];

  it('détecte le même nom à quelques dizaines de mètres, malgré accents et casse', () => {
    expect(isDuplicatePlace({ name: 'marche DANTOKPA', latitude: 6.3705, longitude: 2.4326 }, existing)).toBe(true);
  });

  it('accepte le même nom dans une autre ville', () => {
    expect(isDuplicatePlace({ name: 'Marché Dantokpa', latitude: 5.36, longitude: -4.0 }, existing)).toBe(false);
  });

  it('accepte un nom différent au même endroit', () => {
    expect(isDuplicatePlace({ name: 'Centre culturel', latitude: 6.3703, longitude: 2.4325 }, existing)).toBe(false);
  });

  it('un nom vide n’est jamais un doublon', () => {
    expect(isDuplicatePlace({ name: '!!!', latitude: 6.3703, longitude: 2.4325 }, [{ name: '???', latitude: 6.3703, longitude: 2.4325 }])).toBe(false);
  });
});

describe('nextPlaceStatus', () => {
  it('suit les transitions de modération', () => {
    expect(nextPlaceStatus('pending', 'approve')).toBe('published');
    expect(nextPlaceStatus('pending', 'reject')).toBe('rejected');
    expect(nextPlaceStatus('published', 'reject')).toBe('rejected');
    expect(nextPlaceStatus('rejected', 'approve')).toBe('published');
  });

  it('refuse de rejouer la même décision', () => {
    expect(nextPlaceStatus('published', 'approve')).toBeNull();
    expect(nextPlaceStatus('rejected', 'reject')).toBeNull();
  });
});

describe('isValidRejectionReason', () => {
  it('exige une raison de 3 à 300 caractères', () => {
    expect(isValidRejectionReason('Adresse privée')).toBe(true);
    expect(isValidRejectionReason('  ')).toBe(false);
    expect(isValidRejectionReason('ab')).toBe(false);
    expect(isValidRejectionReason(undefined)).toBe(false);
    expect(isValidRejectionReason('x'.repeat(301))).toBe(false);
  });
});

describe('schémas', () => {
  const valid = { name: 'Marché Dantokpa', category: 'marche', latitude: 6.37, longitude: 2.43 };

  it('accepte une proposition valide', () => {
    expect(proposePlaceSchema.safeParse(valid).success).toBe(true);
  });

  it('refuse une catégorie inconnue (pas de « domicile »), des coordonnées hors bornes', () => {
    expect(PLACE_CATEGORIES as readonly string[]).not.toContain('domicile');
    expect(proposePlaceSchema.safeParse({ ...valid, category: 'domicile' }).success).toBe(false);
    expect(proposePlaceSchema.safeParse({ ...valid, latitude: 91 }).success).toBe(false);
  });

  it('refuse qu’une personne fixe elle-même le statut ou l’auteur', () => {
    expect(proposePlaceSchema.safeParse({ ...valid, status: 'published' }).success).toBe(false);
    expect(proposePlaceSchema.safeParse({ ...valid, createdBy: 'x' }).success).toBe(false);
  });

  it('borne le rayon de lecture à 50 km', () => {
    expect(listPlacesQuerySchema.parse({ lat: '6.3', lon: '2.4' }).radiusKm).toBe(25);
    expect(listPlacesQuerySchema.safeParse({ lat: 6.3, lon: 2.4, radiusKm: 500 }).success).toBe(false);
  });
});
