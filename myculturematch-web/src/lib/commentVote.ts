/** Application locale du résultat d'un vote de commentaire (sans recharger toutes les pages). */

interface Votable {
  id: string;
  score: number;
  myVote: number;
}

/**
 * Remplace `score` et `myVote` du commentaire visé dans les pages déjà chargées, avec la réponse du serveur.
 * Les pages qui ne contiennent pas le commentaire gardent leur identité (pas de rendu inutile) ;
 * l'ordre des commentaires n'est jamais modifié : la liste ne « saute » pas.
 */
export function applyVoteToPages<C extends Votable, P extends { comments: C[] }>(
  pages: P[],
  commentId: string,
  vote: { myVote: number; score: number },
): P[] {
  return pages.map((page) => {
    if (!page.comments?.some((c) => c.id === commentId)) return page;
    return { ...page, comments: page.comments.map((c) => (c.id === commentId ? { ...c, myVote: vote.myVote, score: vote.score } : c)) };
  });
}
