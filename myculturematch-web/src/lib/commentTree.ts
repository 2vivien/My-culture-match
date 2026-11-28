/**
 * Logique pure de l'arbre de commentaires (aucun DOM, aucun React) : construction, fusion des pages,
 * compteurs de descendants et calcul des nœuds visibles (repli, plafond de profondeur, focus d'un fil).
 * Testée depuis backend/tests/unit/posts/comment-tree.test.ts (le web n'a pas de runner unitaire).
 */

export interface FlatComment { id: string; parentId: string | null }
export type WithReplies<T extends FlatComment> = T & { replies: WithReplies<T>[] };

/** Profondeur d'affichage maximale (niveaux visibles) avant le lien « Continuer ce fil ». */
export const MAX_COMMENT_DEPTH = 6;

/**
 * Fusionne des pages successives en une liste plate sans doublon (premier exemplaire conservé, ordre
 * des pages préservé) : un décalage numérique peut renvoyer un même commentaire sur deux pages.
 */
export function mergeCommentPages<T extends FlatComment>(pages: T[][]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const page of pages) {
    for (const c of page) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
    }
  }
  return out;
}

/**
 * Liste plate -> arbre. L'ordre d'entrée est conservé entre frères. Un commentaire dont le parent n'est
 * pas (encore) chargé devient une racine : rien n'est perdu quand les pages arrivent dans le désordre.
 */
export function buildCommentTree<T extends FlatComment>(flat: T[]): WithReplies<T>[] {
  const map = new Map<string, WithReplies<T>>();
  for (const c of flat) map.set(c.id, { ...c, replies: [] });
  const roots: WithReplies<T>[] = [];
  for (const c of flat) {
    const node = map.get(c.id)!;
    const parent = c.parentId && c.parentId !== c.id ? map.get(c.parentId) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  return roots;
}

/** Nombre total de descendants (réponses, réponses de réponses…) d'un nœud. */
export function countDescendants(node: { replies: unknown[] }): number {
  let total = 0;
  for (const r of node.replies as Array<{ replies: unknown[] }>) total += 1 + countDescendants(r);
  return total;
}

/** Nombre total de nœuds d'une forêt. */
export function countAll(nodes: Array<{ replies: unknown[] }>): number {
  return nodes.reduce((acc, n) => acc + 1 + countDescendants(n), 0);
}

/** Retrouve un nœud par id dans une forêt (parcours en profondeur), sinon null. */
export function findNode<N extends { id: string; replies: N[] }>(nodes: N[], id: string): N | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.replies, id);
    if (found) return found;
  }
  return null;
}

export interface VisibleComment<N> {
  node: N;
  /** 0 pour une racine d'affichage. */
  depth: number;
  /** Nombre total de descendants (affiché sur « N réponses »). */
  descendants: number;
  /** Vrai si la branche est repliée : ses réponses ne sont pas dans la liste. */
  collapsed: boolean;
  /** Vrai si le plafond de profondeur est atteint et que le nœud a des réponses non affichées. */
  continueThread: boolean;
}

/**
 * Aplatit l'arbre en liste d'éléments à afficher, dans l'ordre du document.
 * - une branche repliée (id dans `collapsed`) masque tous ses descendants ;
 * - un nœud au dernier niveau autorisé (`maxDepth - 1`) n'affiche pas ses réponses mais propose « Continuer ce fil ».
 */
export function flattenVisible<N extends { id: string; replies: N[] }>(
  roots: N[],
  collapsed: ReadonlySet<string>,
  maxDepth: number = MAX_COMMENT_DEPTH,
): VisibleComment<N>[] {
  const out: VisibleComment<N>[] = [];
  const limit = Math.max(1, maxDepth);
  const visit = (node: N, depth: number) => {
    const hasReplies = node.replies.length > 0;
    const isCollapsed = hasReplies && collapsed.has(node.id);
    const atLimit = depth >= limit - 1;
    out.push({
      node,
      depth,
      descendants: countDescendants(node),
      collapsed: isCollapsed,
      continueThread: hasReplies && atLimit && !isCollapsed,
    });
    if (!hasReplies || isCollapsed || atLimit) return;
    for (const r of node.replies) visit(r, depth + 1);
  };
  for (const r of roots) visit(r, 0);
  return out;
}

/** Bascule un id dans un ensemble de branches repliées (renvoie un nouvel ensemble, sans muter l'ancien). */
export function toggleCollapsed(collapsed: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(collapsed);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
