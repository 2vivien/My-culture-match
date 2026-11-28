import { describe, expect, it } from 'vitest';
import { CELL_DEGREES, obfuscatePosition } from '../../../src/modules/location/location.privacy';

const SECRET = 'test-secret-test-secret-test-secret-32';
const km = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) =>
  Math.hypot((a.latitude - b.latitude) * 111, (a.longitude - b.longitude) * 111 * Math.cos((a.latitude * Math.PI) / 180));

describe('obfuscatePosition', () => {
  const exact = { latitude: 6.36536, longitude: 2.41833 };

  it('ne renvoie jamais la position exacte', () => {
    const p = obfuscatePosition(exact.latitude, exact.longitude, 'u1', 'approximate', SECRET);
    expect(p.latitude).not.toBe(exact.latitude);
    expect(p.longitude).not.toBe(exact.longitude);
  });

  it('reste dans la cellule de grille de la position réelle', () => {
    for (const precision of ['approximate', 'area'] as const) {
      const size = CELL_DEGREES[precision];
      const p = obfuscatePosition(exact.latitude, exact.longitude, 'u1', precision, SECRET);
      expect(Math.floor(p.latitude / size)).toBe(Math.floor(exact.latitude / size));
      expect(Math.floor(p.longitude / size)).toBe(Math.floor(exact.longitude / size));
    }
  });

  it('est identique pour deux positions de la même cellule (recoupement inutile)', () => {
    const a = obfuscatePosition(6.3601, 2.4101, 'u1', 'approximate', SECRET);
    const b = obfuscatePosition(6.3699, 2.4199, 'u1', 'approximate', SECRET);
    expect(a).toEqual(b);
  });

  it('dépend du secret serveur : l’id public ne suffit pas à retrouver le décalage', () => {
    const a = obfuscatePosition(exact.latitude, exact.longitude, 'u1', 'approximate', SECRET);
    const b = obfuscatePosition(exact.latitude, exact.longitude, 'u1', 'approximate', 'un-autre-secret-un-autre-secret-32');
    expect(a).not.toEqual(b);
  });

  it('sépare deux utilisateurs de la même cellule', () => {
    const a = obfuscatePosition(exact.latitude, exact.longitude, 'u1', 'approximate', SECRET);
    const b = obfuscatePosition(exact.latitude, exact.longitude, 'u2', 'approximate', SECRET);
    expect(a).not.toEqual(b);
  });

  it('l’erreur maximale est bornée par la diagonale de la cellule', () => {
    for (let i = 0; i < 200; i++) {
      const lat = -60 + Math.random() * 120;
      const lon = -170 + Math.random() * 340;
      const p = obfuscatePosition(lat, lon, `u${i}`, 'approximate', SECRET);
      expect(km({ latitude: lat, longitude: lon }, p)).toBeLessThan(CELL_DEGREES.approximate * 111 * 1.5 + 0.01);
    }
  });

  it('gère les coordonnées négatives (hémisphères sud/ouest)', () => {
    const size = CELL_DEGREES.approximate;
    const p = obfuscatePosition(-33.8688, -70.6693, 'u1', 'approximate', SECRET);
    expect(Math.floor(p.latitude / size)).toBe(Math.floor(-33.8688 / size));
    expect(Math.floor(p.longitude / size)).toBe(Math.floor(-70.6693 / size));
  });
});
