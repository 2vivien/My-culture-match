import { describe, expect, it } from 'vitest';
import { sortCommentTree, wilsonLowerBound, type RankableComment } from '../../../src/modules/posts/comments.ranking';

const c = (id: string, parentId: string | null, minutes: number, ups = 0, downs = 0): RankableComment =>
  ({ id, parentId, createdAt: new Date(Date.UTC(2026, 10, 27, 12, minutes)), ups, downs });

describe('wilsonLowerBound', () => {
  it('vaut 0 sans vote et reste dans [0, 1]', () => {
    expect(wilsonLowerBound(0, 0)).toBe(0);
    for (const [u, d] of [[1, 0], [0, 1], [50, 50], [1000, 3]] as const) {
      const w = wilsonLowerBound(u, d);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(1);
    }
  });

  it('privilégie la fiabilité : 10/10 devant 1/1', () => {
    expect(wilsonLowerBound(10, 0)).toBeGreaterThan(wilsonLowerBound(1, 0));
  });

  it('un commentaire très voté mais clivant passe après un commentaire très apprécié', () => {
    expect(wilsonLowerBound(90, 10)).toBeGreaterThan(wilsonLowerBound(100, 100));
  });
});

describe('sortCommentTree', () => {
  const items = [c('a', null, 1, 1, 0), c('b', null, 2, 5, 0), c('a1', 'a', 3, 0, 4), c('a2', 'a', 4, 3, 0), c('b1', 'b', 5, 1, 0)];

  it('top : racines puis réponses, chacune triée par score net', () => {
    expect(sortCommentTree(items, 'top').map((x) => x.id)).toEqual(['b', 'b1', 'a', 'a2', 'a1']);
  });

  it('new : le plus récent d’abord, à chaque niveau', () => {
    expect(sortCommentTree(items, 'new').map((x) => x.id)).toEqual(['b', 'b1', 'a', 'a2', 'a1']);
  });

  it('old : ordre chronologique, à chaque niveau', () => {
    expect(sortCommentTree(items, 'old').map((x) => x.id)).toEqual(['a', 'a1', 'a2', 'b', 'b1']);
  });

  it('best : les réponses restent groupées sous leur parent', () => {
    const order = sortCommentTree(items, 'best').map((x) => x.id);
    expect(order.indexOf('a1')).toBeGreaterThan(order.indexOf('a'));
    expect(order.indexOf('b1')).toBe(order.indexOf('b') + 1);
  });

  it('un commentaire dont le parent est absent devient une racine (rien n’est perdu)', () => {
    const out = sortCommentTree([c('x', 'inconnu', 1), c('y', null, 2)], 'old').map((i) => i.id);
    expect(out.sort()).toEqual(['x', 'y']);
  });
});
