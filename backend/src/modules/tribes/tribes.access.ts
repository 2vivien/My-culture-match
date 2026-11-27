import { and, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';

export { canReadTribeContent, type TribeVisibility } from './tribes.visibility';

/**
 * Condition SQL « ce post est lisible par ce lecteur » : hors tribu, tribu publique, ou membre d'une tribu privée.
 * À ajouter à toute requête qui liste des posts (recherche, fils globaux).
 */
export function readablePostCondition(viewerId: string): SQL {
  return sql`(${schema.posts.tribeId} IS NULL OR NOT EXISTS (
    SELECT 1 FROM tribes t
    WHERE t.id = ${schema.posts.tribeId} AND t.visibility = 'private'
      AND NOT EXISTS (SELECT 1 FROM tribe_members m WHERE m.tribe_id = t.id AND m.user_id = ${viewerId})
  ))`;
}

/** Parmi ces tribus, ids des tribus privées dont le lecteur n'est pas membre. */
export async function unreadableTribeIds(tribeIds: string[], viewerId: string): Promise<Set<string>> {
  const unique = [...new Set(tribeIds)];
  if (unique.length === 0) return new Set();
  const priv = await db.select({ id: schema.tribes.id }).from(schema.tribes)
    .where(and(inArray(schema.tribes.id, unique), eq(schema.tribes.visibility, 'private')));
  if (priv.length === 0) return new Set();
  const mine = await db.select({ tribeId: schema.tribeMembers.tribeId }).from(schema.tribeMembers)
    .where(and(inArray(schema.tribeMembers.tribeId, priv.map((p) => p.id)), eq(schema.tribeMembers.userId, viewerId)));
  const mineSet = new Set(mine.map((m) => m.tribeId));
  return new Set(priv.map((p) => p.id).filter((id) => !mineSet.has(id)));
}

/** Lève 404 (on ne confirme pas l'existence) si le post d'une tribu privée n'est pas lisible par ce lecteur. */
export async function assertCanReadTribePost(tribeId: string | null | undefined, viewerId: string): Promise<void> {
  if (!tribeId) return;
  const blocked = await unreadableTribeIds([tribeId], viewerId);
  if (blocked.has(tribeId)) throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');
}
