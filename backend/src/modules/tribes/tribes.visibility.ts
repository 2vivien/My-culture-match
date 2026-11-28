export type TribeVisibility = 'public' | 'private';

/** Le contenu d'une tribu (posts, commentaires, listes) est lisible si elle est publique ou si on en est membre. */
export function canReadTribeContent(visibility: TribeVisibility | string, isMember: boolean): boolean {
  return visibility !== 'private' || isMember;
}
