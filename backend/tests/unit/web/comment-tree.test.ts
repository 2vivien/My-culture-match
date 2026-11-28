import { describe, expect, it } from 'vitest';
// Logique pure du front (aucun DOM) : testée ici car le web n'a pas encore de runner unitaire.
import {
  buildCommentTree, countAll, countDescendants, findNode, flattenVisible, MAX_COMMENT_DEPTH, mergeCommentPages, toggleCollapsed,
} from '../../../../myculturematch-web/src/lib/commentTree';

const c = (id: string, parentId: string | null = null) => ({ id, parentId });
const chainOf = (n: number) => buildCommentTree([c('n0'), ...Array.from({ length: n - 1 }, (_, i) => c(`n${i + 1}`, `n${i}`))]);

describe('mergeCommentPages', () => {
  it('concatène les pages dans l’ordre et retire les doublons', () => {
    const merged = mergeCommentPages([[c('a'), c('b')], [c('b'), c('c')]]);
    expect(merged.map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });
  it('gère zéro page', () => expect(mergeCommentPages([])).toEqual([]));
});

describe('buildCommentTree', () => {
  it('rattache les réponses à leur parent en conservant l’ordre', () => {
    const tree = buildCommentTree([c('r1'), c('r2'), c('a', 'r1'), c('b', 'r1'), c('aa', 'a')]);
    expect(tree.map((n) => n.id)).toEqual(['r1', 'r2']);
    expect(tree[0].replies.map((n) => n.id)).toEqual(['a', 'b']);
    expect(tree[0].replies[0].replies.map((n) => n.id)).toEqual(['aa']);
  });
  it('traite un orphelin (parent non chargé) comme une racine', () => {
    expect(buildCommentTree([c('x', 'absent')]).map((n) => n.id)).toEqual(['x']);
  });
  it('ne boucle pas sur un commentaire qui est son propre parent', () => {
    expect(buildCommentTree([c('x', 'x')]).map((n) => n.id)).toEqual(['x']);
  });
  it('une réponse qui arrive à la page suivante est regroupée sous son parent', () => {
    const tree = buildCommentTree(mergeCommentPages([[c('r1'), c('a', 'r1')], [c('aa', 'a'), c('r2')]]));
    expect(countAll(tree)).toBe(4);
    expect(tree[0].replies[0].replies[0].id).toBe('aa');
  });
});

describe('compteurs', () => {
  const tree = buildCommentTree([c('r1'), c('a', 'r1'), c('b', 'r1'), c('aa', 'a'), c('r2')]);
  it('countDescendants compte toute la descendance', () => {
    expect(countDescendants(tree[0])).toBe(3);
    expect(countDescendants(tree[1])).toBe(0);
  });
  it('countAll compte tous les nœuds', () => expect(countAll(tree)).toBe(5));
  it('findNode retrouve un nœud profond ou renvoie null', () => {
    expect(findNode(tree, 'aa')?.id).toBe('aa');
    expect(findNode(tree, 'zz')).toBeNull();
  });
});

describe('flattenVisible', () => {
  const tree = buildCommentTree([c('r1'), c('a', 'r1'), c('aa', 'a'), c('b', 'r1'), c('r2')]);
  const ids = (items: Array<{ node: { id: string } }>) => items.map((i) => i.node.id);

  it('liste tout dans l’ordre du document avec la profondeur', () => {
    const items = flattenVisible(tree, new Set());
    expect(ids(items)).toEqual(['r1', 'a', 'aa', 'b', 'r2']);
    expect(items.map((i) => i.depth)).toEqual([0, 1, 2, 1, 0]);
    expect(items[0].descendants).toBe(3);
    expect(items.every((i) => !i.collapsed && !i.continueThread)).toBe(true);
  });

  it('une branche repliée masque ses descendants et expose leur nombre', () => {
    const items = flattenVisible(tree, new Set(['r1']));
    expect(ids(items)).toEqual(['r1', 'r2']);
    expect(items[0]).toMatchObject({ collapsed: true, descendants: 3 });
  });

  it('replier un nœud sans réponse est sans effet', () => {
    const items = flattenVisible(tree, new Set(['r2']));
    expect(items.find((i) => i.node.id === 'r2')?.collapsed).toBe(false);
  });

  it('plafonne la profondeur et propose « Continuer ce fil » au dernier niveau', () => {
    const items = flattenVisible(chainOf(10), new Set());
    expect(items).toHaveLength(MAX_COMMENT_DEPTH);
    const last = items[items.length - 1];
    expect(last.depth).toBe(MAX_COMMENT_DEPTH - 1);
    expect(last.continueThread).toBe(true);
    expect(last.descendants).toBe(4);
    expect(items.slice(0, -1).every((i) => !i.continueThread)).toBe(true);
  });

  it('pas de « Continuer ce fil » au dernier niveau si le nœud n’a pas de réponses', () => {
    const items = flattenVisible(chainOf(3), new Set(), 3);
    expect(items).toHaveLength(3);
    expect(items[2].continueThread).toBe(false);
  });

  it('un nœud replié au dernier niveau n’affiche pas « Continuer ce fil »', () => {
    const items = flattenVisible(chainOf(3), new Set(['n1']), 2);
    expect(items[1]).toMatchObject({ collapsed: true, continueThread: false });
  });

  it('« Continuer ce fil » : le sous-arbre choisi repart à la profondeur 0', () => {
    const chain = chainOf(10);
    const focus = findNode(chain, 'n5')!;
    const items = flattenVisible([focus], new Set());
    expect(items[0].depth).toBe(0);
    expect(ids(items)).toEqual(['n5', 'n6', 'n7', 'n8', 'n9']);
  });
});

describe('toggleCollapsed', () => {
  it('ajoute puis retire un id sans muter l’ensemble d’origine', () => {
    const base = new Set<string>();
    const a = toggleCollapsed(base, 'x');
    expect(a.has('x')).toBe(true);
    expect(base.size).toBe(0);
    expect(toggleCollapsed(a, 'x').has('x')).toBe(false);
  });
});
