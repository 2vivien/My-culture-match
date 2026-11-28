import { describe, expect, it } from 'vitest';
import { mapGeocodeResults } from '../../../../myculturematch-web/src/lib/geocodeResults';

describe('mapGeocodeResults', () => {
  it('garde la forme PlaceSearchResult avec une clé unique et un libellé court', () => {
    const out = mapGeocodeResults({ results: [
      { label: 'Lyon, Métropole de Lyon, Rhône, France', latitude: 45.76, longitude: 4.83 },
      { label: 'Lyon, Ohio, États-Unis', latitude: 41.1, longitude: -83.2 },
    ] });
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ label: 'Lyon, Métropole de Lyon', latitude: 45.76, longitude: 4.83 });
    expect(out[0].key).not.toBe(out[1].key);
  });

  it('ignore les lignes sans coordonnées valides', () => {
    const out = mapGeocodeResults({ results: [
      { label: 'A', latitude: 'x', longitude: 1 },
      { label: 'B', latitude: NaN, longitude: 1 },
      null,
      { label: 'C', latitude: 1, longitude: 2 },
    ] });
    expect(out.map((r) => r.label)).toEqual(['C']);
  });

  it('libellé absent : repli sur les coordonnées', () => {
    expect(mapGeocodeResults({ results: [{ latitude: 1.234, longitude: 5.678 }] })[0].label).toBe('1.23, 5.68');
  });

  it('réponse inattendue : liste vide', () => {
    expect(mapGeocodeResults(null)).toEqual([]);
    expect(mapGeocodeResults({})).toEqual([]);
    expect(mapGeocodeResults({ results: 'x' })).toEqual([]);
  });
});
