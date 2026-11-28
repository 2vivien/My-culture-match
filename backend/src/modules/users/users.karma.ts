import { and, eq, ne, sql } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';

export interface Karma {
  /** Total = posts + commentaires. */
  total: number;
  posts: number;
  comments: number;
}

/**
 * Karma d'un utilisateur : somme nette des votes (+1 / -1) reçus sur ses posts et commentaires publiés.
 * Les votes de l'auteur sur son propre contenu ne comptent pas (pas d'auto-gonflage) ; le contenu supprimé,
 * signalé ou en attente de modération ne compte pas non plus.
 */
export async function getKarma(userId: string): Promise<Karma> {
  const [user] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');

  const [postRow] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.postVotes.value}), 0)::int` })
    .from(schema.postVotes)
    .innerJoin(schema.posts, eq(schema.posts.id, schema.postVotes.postId))
    .where(and(eq(schema.posts.authorId, userId), eq(schema.posts.status, 'published'), ne(schema.postVotes.userId, userId)));

  const [commentRow] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.commentVotes.value}), 0)::int` })
    .from(schema.commentVotes)
    .innerJoin(schema.comments, eq(schema.comments.id, schema.commentVotes.commentId))
    .where(and(eq(schema.comments.userId, userId), eq(schema.comments.status, 'published'), ne(schema.commentVotes.userId, userId)));

  const posts = postRow?.total ?? 0;
  const comments = commentRow?.total ?? 0;
  return { total: posts + comments, posts, comments };
}
