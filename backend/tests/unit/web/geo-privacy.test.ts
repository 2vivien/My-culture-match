import { describe, expect, it } from 'vitest';
import { coarsePositionQuery, roundCoord } from '../../../../myculturematch-web/src/lib/geoPrivacy';

describe('roundCoord', () => {
  it('arrondit à 2 décimales', () => {
    expect(roundCoord(48.856614)).toBe(48.86);
    expect(roundCoord(2.352222)).toBe(2.35);
    expect(roundCoord(-73.9857)).toBe(-73.99);
  });
  it('ne produit pas de -0', () => {
    expect(Object.is(roundCoord(-0.001), 0)).toBe(true);
  });
});

describe('coarsePositionQuery', () => {
  it('n’envoie jamais le point GPS exact', () => {
    const q = coarsePositionQuery({ latitude: 48.8566141, longitude: 2.3522219 });
    expect(q).toBe('?lat=48.86&lon=2.35');
    expect(q).not.toContain('48.8566');
  });
  it('position absente ou invalide : pas de query', () => {
    expect(coarsePositionQuery(undefined)).toBe('');
    expect(coarsePositionQuery(null)).toBe('');
    expect(coarsePositionQuery({ latitude: NaN, longitude: 1 })).toBe('');
  });
});
