/** Tri des commentaires (pur, testable) : best / top / new / old. */
export type CommentSort = 'best' | 'top' | 'new' | 'old';

export interface RankableComment { id: string; parentId: string | null; createdAt: Date; ups: number; downs: number }

/**
 * Borne basse de l'intervalle de Wilson (95 %) sur la part de votes positifs — le « best » de Reddit :
 * un commentaire avec 10 votes sur 10 passe devant un commentaire avec 1 vote sur 1, car il est plus fiable.
 */
export function wilsonLowerBound(ups: number, downs: number): number {
  const n = ups + downs;
  if (n === 0) return 0;
  const z = 1.96;
  const p = ups / n;
  return (p + (z * z) / (2 * n) - z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / (1 + (z * z) / n);
}

function compare(sort: CommentSort): (a: RankableComment, b: RankableComment) => number {
  const time = (a: RankableComment, b: RankableComment) => b.createdAt.getTime() - a.createdAt.getTime();
  switch (sort) {
    case 'best': return (a, b) => wilsonLowerBound(b.ups, b.downs) - wilsonLowerBound(a.ups, a.downs) || time(a, b);
    case 'top': return (a, b) => (b.ups - b.downs) - (a.ups - a.downs) || time(a, b);
    case 'old': return (a, b) => -time(a, b);
    default: return time;
  }
}

/**
 * Renvoie les commentaires dans l'ordre d'affichage d'un arbre : chaque commentaire racine suivi de ses
 * réponses (triées avec la même règle), récursivement. Un commentaire dont le parent est absent est traité
 * comme une racine pour ne jamais être perdu.
 */
export function sortCommentTree<T extends RankableComment>(items: T[], sort: CommentSort): T[] {
  const ids = new Set(items.map((i) => i.id));
  const cmp = compare(sort);
  const children = new Map<string | null, T[]>();
  for (const item of items) {
    const key = item.parentId && ids.has(item.parentId) ? item.parentId : null;
    children.set(key, [...(children.get(key) ?? []), item]);
  }
  const out: T[] = [];
  const visit = (parent: string | null) => {
    for (const child of [...(children.get(parent) ?? [])].sort(cmp)) {
      out.push(child);
      visit(child.id);
    }
  };
  visit(null);
  return out;
}
