import { and, desc, eq, gt, inArray } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { followingKey } from './fanout';
import { getPostsByIds, type HydratedPost } from '../posts/posts.service';
import { scoreFeed, type FeedContext, type PostFeatures, type UserFeatures } from '../culture-engine/scoring';

const FEED_CANDIDATES = 500;
const FOR_YOU_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

async function blockedIds(userId: string): Promise<Set<string>> {
  const rows = await db.select({ blockedId: schema.blocks.blockedId }).from(schema.blocks).where(eq(schema.blocks.blockerId, userId));
  return new Set(rows.map((r) => r.blockedId));
}

function toFeatures(post: HydratedPost): PostFeatures {
  return {
    id: post.id,
    authorId: post.author.id,
    type: post.type,
    title: post.title,
    body: post.body,
    tags: post.tags,
    status: post.status,
    likes: post.likes,
    comments: post.comments,
    views: post.views,
    createdAt: post.createdAt,
    tribeId: post.tribe?.id ?? null,
  };
}

/** GET /api/feed?filter=following|for-you|popular|new — posts rankés par le Culture Engine. */
export async function getFeed(
  userId: string,
  filter: 'following' | 'for-you' | 'popular' | 'new' = 'following',
  limit = 20,
): Promise<{ posts: HydratedPost[]; total: number }> {
  const [me] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!me) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');

  const blocked = await blockedIds(userId);

  let postIds: string[];
  if (filter === 'following') {
    postIds = await redis.zrevrange(followingKey(userId), 0, FEED_CANDIDATES - 1);
  } else {
    const rows = await db
      .select({ id: schema.posts.id, authorId: schema.posts.authorId })
      .from(schema.posts)
      .where(and(eq(schema.posts.status, 'published'), gt(schema.posts.createdAt, new Date(Date.now() - FOR_YOU_WINDOW_MS))))
      .orderBy(desc(schema.posts.createdAt))
      .limit(FEED_CANDIDATES);
    postIds = rows.map((r) => r.id);
  }

  if (postIds.length === 0) return { posts: [], total: 0 };

  const hydrated = await getPostsByIds(postIds, userId);
  const candidates = hydrated.filter((p) => !blocked.has(p.author.id) && p.author.id !== userId);

  if (candidates.length === 0) return { posts: [], total: 0 };

  // Vecteurs pour la résonance culturelle
  const [uvecRow] = await db.select({ vector: schema.userProfileVectors.vector }).from(schema.userProfileVectors).where(eq(schema.userProfileVectors.userId, userId)).limit(1);
  const pvecRows = await db.select({ postId: schema.postProfileVectors.postId, vector: schema.postProfileVectors.vector }).from(schema.postProfileVectors).where(inArray(schema.postProfileVectors.postId, candidates.map((p) => p.id)));

  const userVector = uvecRow?.vector ?? {};
  const postVectors: Record<string, Record<string, number>> = {};
  for (const row of pvecRows) postVectors[row.postId] = row.vector;

  const userCulture = [...(me.values ?? []), me.country, me.region, me.ethnicity].filter((v): v is string => Boolean(v));
  const user: UserFeatures = {
    id: me.id,
    values: me.values,
    languages: me.languages,
    ethnicity: me.ethnicity,
    country: me.country,
    region: me.region,
    interests: me.values ?? [],
  };

  const scored = candidates.map((post) => {
    const ctx: FeedContext = {
      seenPostIds: [],
      userCulture,
      userVector,
      postVectors,
      followingAuthor: filter === 'following',
    };
    return { post, score: scoreFeed(toFeatures(post), user, ctx) };
  });

  scored.sort((a, b) => (filter === 'new' ? new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime() : b.score - a.score));

  return { posts: scored.slice(0, limit).map((s) => s.post), total: scored.length };
}
