import { describe, expect, it } from 'vitest';
import { sharingOffPatch, sharingOnPatch } from '../../../src/modules/location/location.sharing.patch';

const NOW = new Date('2026-06-01T12:00:00Z');

describe('sharingOffPatch', () => {
  it('purge coordonnées ET horodatage de position', () => {
    expect(sharingOffPatch(NOW)).toEqual({ locationSharingEnabled: false, latitude: null, longitude: null, locationUpdatedAt: null, updatedAt: NOW });
  });
});

describe('sharingOnPatch', () => {
  it('écrit les coordonnées et rafraîchit locationUpdatedAt quand de nouvelles coordonnées sont fournies', () => {
    expect(sharingOnPatch({ latitude: 6.37, longitude: 2.39 }, NOW)).toEqual({
      locationSharingEnabled: true, latitude: 6.37, longitude: 2.39, locationUpdatedAt: NOW, updatedAt: NOW,
    });
  });
  it('ne rafraîchit PAS locationUpdatedAt et ne touche pas aux coordonnées sans nouvelles coordonnées', () => {
    for (const coords of [undefined, {}, { latitude: 6.37 }, { longitude: 2.39 }, { latitude: Number.NaN, longitude: 1 }]) {
      const patch = sharingOnPatch(coords, NOW);
      expect(patch).toEqual({ locationSharingEnabled: true, updatedAt: NOW });
      expect(patch).not.toHaveProperty('locationUpdatedAt');
      expect(patch).not.toHaveProperty('latitude');
    }
  });
  it('accepte 0 comme coordonnée valide', () => {
    expect(sharingOnPatch({ latitude: 0, longitude: 0 }, NOW)).toMatchObject({ latitude: 0, longitude: 0, locationUpdatedAt: NOW });
  });
});
