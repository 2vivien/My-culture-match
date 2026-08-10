import { eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';

export const CELEBRITY_FOLLOWER_THRESHOLD = 10_000;
const FEED_TRIM = 1_000;

const followersKey = (authorId: string) => `followers:${authorId}`;
export const followingKey = (userId: string) => `feed:following:${userId}`;

/** Récupère les followerIds d'un auteur (Redis, sinon fallback DB). */
export async function getFollowers(authorId: string): Promise<string[]> {
  const cached = await redis.smembers(followersKey(authorId));
  if (cached.length > 0) return cached;

  const rows = await db
    .select({ followerId: schema.follows.followerId })
    .from(schema.follows)
    .where(eq(schema.follows.followingId, authorId));
  const ids = rows.map((r) => r.followerId);
  if (ids.length > 0) {
    await redis.sadd(followersKey(authorId), ...ids);
    await redis.expire(followersKey(authorId), 24 * 60 * 60);
  }
  return ids;
}

/** Maintenir la liste des followers en Redis (appelé sur follow/unfollow). */
export async function addFollower(authorId: string, followerId: string): Promise<void> {
  await redis.sadd(followersKey(authorId), followerId);
}
export async function removeFollower(authorId: string, followerId: string): Promise<void> {
  await redis.srem(followersKey(authorId), followerId);
}

/**
 * FANOUT PUSH : pousse un post dans le feed following de chaque follower.
 * Mode PULL (skip) si l'auteur dépasse le seuil célébrité.
 */
export async function fanoutPostToFollowers(postId: string, authorId: string): Promise<{ pushed: number; skipped: boolean }> {
  const followers = await getFollowers(authorId);

  if (followers.length >= CELEBRITY_FOLLOWER_THRESHOLD) {
    return { pushed: 0, skipped: true };
  }

  const score = Date.now();
  const pipe = redis.multi();
  for (const followerId of followers) {
    pipe.zadd(followingKey(followerId), score, postId);
  }
  await pipe.exec();

  // Trim à 1000 posts (fenêtre glissante)
  for (const followerId of followers) {
    await redis.zremrangebyrank(followingKey(followerId), 0, -FEED_TRIM - 1);
  }

  return { pushed: followers.length, skipped: false };
}

/** Inverse du fanout : retire un post des feeds following. */
export async function removeFromFeeds(postId: string): Promise<void> {
  // Approximation : marque le post comme supprimé dans le cache (filtrage à la lecture)
  await redis.set(`post:deleted:${postId}`, '1', 'EX', 30 * 60);
}

/** Liste les followers directement depuis la DB (pour tests). */
export async function getFollowersFromDb(authorId: string): Promise<string[]> {
  const rows = await db
    .select({ followerId: schema.follows.followerId })
    .from(schema.follows)
    .where(eq(schema.follows.followingId, authorId));
  return rows.map((r) => r.followerId);
}
