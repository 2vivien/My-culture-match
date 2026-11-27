import { describe, expect, it } from 'vitest';
import { hotRank, sortHot } from '../../../src/modules/feed/feed.home';

const at = (hours: number) => new Date(Date.UTC(2026, 10, 27, 0) + hours * 3600_000);

describe('hotRank', () => {
  it('un score plus élevé classe plus haut à date égale', () => {
    expect(hotRank(100, at(0))).toBeGreaterThan(hotRank(10, at(0)));
    expect(hotRank(10, at(0))).toBeGreaterThan(hotRank(0, at(0)));
    expect(hotRank(0, at(0))).toBeGreaterThan(hotRank(-10, at(0)));
  });

  it('un post plus récent l’emporte à score égal', () => {
    expect(hotRank(5, at(10))).toBeGreaterThan(hotRank(5, at(0)));
  });

  it('accepte une date ISO', () => {
    expect(hotRank(3, at(0).toISOString())).toBeCloseTo(hotRank(3, at(0)), 10);
  });
});

describe('sortHot', () => {
  it('un post très voté récent passe devant un ancien post sans vote', () => {
    const out = sortHot([
      { id: 'vieux', score: 0, createdAt: at(0) },
      { id: 'hot', score: 50, createdAt: at(24) },
    ]);
    expect(out.map((p) => p.id)).toEqual(['hot', 'vieux']);
  });

  it('un très vieux post populaire finit par céder la place', () => {
    const out = sortHot([
      { id: 'ancien', score: 100, createdAt: at(0) },
      { id: 'frais', score: 1, createdAt: at(24 * 10) },
    ]);
    expect(out[0]?.id).toBe('frais');
  });

  it('ne modifie pas le tableau d’entrée', () => {
    const input = [{ id: 'a', score: 0, createdAt: at(0) }, { id: 'b', score: 9, createdAt: at(1) }];
    sortHot(input);
    expect(input.map((p) => p.id)).toEqual(['a', 'b']);
  });
});
