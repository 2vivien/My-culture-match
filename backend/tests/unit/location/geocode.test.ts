import { describe, expect, it } from 'vitest';
import { normalizeGeocodeQuery, parseGeocodeResponse } from '../../../src/modules/location/geocode.parse';

describe('normalizeGeocodeQuery', () => {
  it('ignore casse, accents et espaces multiples', () => {
    expect(normalizeGeocodeQuery('  Cotonou   Bénin ')).toBe('cotonou benin');
  });
});

describe('parseGeocodeResponse', () => {
  it('garde les résultats valides, tronque à 5 et ignore les coordonnées invalides', () => {
    const rows = [
      { lat: '6.36', lon: '2.43', display_name: 'Cotonou, Bénin' },
      { lat: 'abc', lon: '2.43', display_name: 'Invalide' },
      { lat: '95', lon: '2', display_name: 'Latitude hors bornes' },
      null,
      ...Array.from({ length: 8 }, (_, i) => ({ lat: String(i), lon: String(i), display_name: `P${i}` })),
    ];
    const out = parseGeocodeResponse(rows);
    expect(out).toHaveLength(5);
    expect(out[0]).toEqual({ label: 'Cotonou, Bénin', latitude: 6.36, longitude: 2.43 });
  });

  it('renvoie une liste vide si la réponse n’est pas un tableau', () => {
    expect(parseGeocodeResponse({ error: 'x' })).toEqual([]);
    expect(parseGeocodeResponse(undefined)).toEqual([]);
  });
});
