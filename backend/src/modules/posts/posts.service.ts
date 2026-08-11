import { eq, and, lt, desc, inArray } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { extractHashtags, isValidPublicUrl } from '../../shared/utils/content';
import { moderatePost, moderateText } from './moderation';
import { incrementCounter, decrementCounter, getCounterDeltas } from '../feed/counters';
import { createNotification } from '../notifications/notifications.service';
import { enqueueFeedFanout, enqueueSearchIndex, enqueuePostEmbedding } from './posts.jobs';
import { enqueueModerationScan } from '../moderation/moderation.queue';
import { postsCreatedTotal } from '../../infrastructure/monitoring/metrics';
import type { CreatePostInput, CreateCommentInput } from './posts.schemas';

const POST_CACHE_TTL = 30 * 60; // 30 min
const postCacheKey = (id: string) => `post:${id}`;

export interface HydratedPost {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    level: number;
    glow: string;
  };
  tribe: { id: string; name: string; tag: string } | null;
  type: string;
  title: string | null;
  body: string | null;
  mediaUrls: string[];
  linkUrl: string | null;
  tags: string[];
  status: string;
  pinned: boolean;
  score: number;
  likes: number;
  comments: number;
  views: number;
  saves: number;
  shares: number;
  likedByMe: boolean;
  savedByMe: boolean;
  myVote: number;
  createdAt: string;
  updatedAt: string;
}

/** Crée une tradition. Fanout + indexation + embedding en arrière-plan. */
export async function createPost(userId: string, input: CreatePostInput): Promise<HydratedPost> {
  if (input.type === 'Images' && (!input.mediaUrls || input.mediaUrls.length === 0)) {
    throw AppError.badRequest('Un post Images nécessite au moins un média', 'MEDIA_REQUIRED');
  }
  if (input.type === 'Link') {
    if (!input.linkUrl) throw AppError.badRequest('Un post Link nécessite une URL', 'LINK_REQUIRED');
    if (!isValidPublicUrl(input.linkUrl)) {
      throw AppError.badRequest('URL invalide : seules les URLs publiques (http/https) sont acceptées', 'INVALID_URL');
    }
  }
  if (input.type === 'Text' && !input.body?.trim()) {
    throw AppError.badRequest('Un post Text nécessite un contenu', 'BODY_REQUIRED');
  }

  if (input.tribeId) {
    const member = await db
      .select({ userId: schema.tribeMembers.userId })
      .from(schema.tribeMembers)
      .where(and(eq(schema.tribeMembers.tribeId, input.tribeId), eq(schema.tribeMembers.userId, userId)))
      .limit(1);
    if (!member[0]) throw AppError.forbidden('Vous devez être membre de cette tribu pour y poster', 'TRIBE_MEMBERSHIP_REQUIRED');
  }

  const moderation = moderatePost(input.title, input.body);
  const status = moderation.flag ? 'flagged' : 'published';
  const tags = input.tags ?? [];
  for (const t of extractHashtags(`${input.title} ${input.body ?? ''}`)) {
    if (!tags.includes(t)) tags.push(t);
    if (tags.length >= 5) break;
  }

  const [post] = await db
    .insert(schema.posts)
    .values({
      authorId: userId,
      tribeId: input.tribeId ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      mediaUrls: input.mediaUrls ?? [],
      linkUrl: input.linkUrl ?? null,
      tags,
      status,
    })
    .returning();

  // Jobs async : fanout followers, indexation search, embedding post, scan modération
  if (!post) throw AppError.badRequest('Échec de création du post', 'POST_CREATE_FAILED');
  await enqueueFeedFanout(post.id, userId);
  if (status === 'published') {
    await enqueueSearchIndex(post.id);
  }
  await enqueuePostEmbedding(post.id);
  await enqueueModerationScan('post', post.id);
  postsCreatedTotal.inc();

  return hydratePost(post, userId, await postRelations(post.id, userId));
}

async function postRelations(postId: string, userId: string): Promise<{ liked: boolean; saved: boolean; vote: number }> {
  const [like] = await db.select().from(schema.postLikes).where(and(eq(schema.postLikes.postId, postId), eq(schema.postLikes.userId, userId))).limit(1);
  const [save] = await db.select().from(schema.saves).where(and(eq(schema.saves.postId, postId), eq(schema.saves.userId, userId))).limit(1);
  const [vote] = await db.select().from(schema.postVotes).where(and(eq(schema.postVotes.postId, postId), eq(schema.postVotes.userId, userId))).limit(1);
  return { liked: Boolean(like), saved: Boolean(save), vote: vote?.value ?? 0 };
}

async function hydratePost(post: schema.Post, _viewerId: string, rel: { liked: boolean; saved: boolean; vote: number }): Promise<HydratedPost> {
  const [author] = await db.select().from(schema.users).where(eq(schema.users.id, post.authorId)).limit(1);
  const tribe = post.tribeId
    ? (await db.select().from(schema.tribes).where(eq(schema.tribes.id, post.tribeId)).limit(1))[0] ?? null
    : null;
  const deltas = await getCounterDeltas(post.id);

  return {
    id: post.id,
    author: author
      ? { id: author.id, name: author.name, username: author.username, avatar: author.avatar, level: author.level, glow: author.glow }
      : { id: post.authorId, name: 'Utilisateur', username: 'user', avatar: null, level: 1, glow: 'none' },
    tribe: tribe ? { id: tribe.id, name: tribe.name, tag: tribe.tag ?? '' } : null,
    type: post.type,
    title: post.title,
    body: post.body,
    mediaUrls: post.mediaUrls ?? [],
    linkUrl: post.linkUrl,
    tags: post.tags ?? [],
    status: post.status,
    pinned: post.pinned,
    score: post.score,
    likes: post.likes + deltas.likes,
    comments: post.comments + deltas.comments,
    views: post.views + deltas.views,
    saves: post.saves + deltas.saves,
    shares: post.shares + deltas.shares,
    likedByMe: rel.liked,
    savedByMe: rel.saved,
    myVote: rel.vote,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

/** GET /api/posts/:id — détail (exclut les posts non publiés pour les tiers). */
export async function getPostById(postId: string, viewerId: string): Promise<HydratedPost> {  const cached = await redis.get(postCacheKey(postId));
  if (cached) {
    const post = JSON.parse(cached) as schema.Post;
    if (post.status !== 'deleted') {
      const rel = await postRelations(postId, viewerId);
      return hydratePost(post, viewerId, rel);
    }
  }

  const [post] = await db.select().from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post) throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');
  if (post.status === 'deleted') throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');
  if (post.status === 'flagged' && post.authorId !== viewerId) {
    throw AppError.forbidden('Ce post est en attente de modération', 'POST_FLAGGED');
  }

  await redis.set(postCacheKey(postId), JSON.stringify(post), 'EX', POST_CACHE_TTL);
  const rel = await postRelations(postId, viewerId);
  return hydratePost(post, viewerId, rel);
}

/** Hydratation groupée (feed) : exclut supprimés + flagged hors auteur. */
export async function getPostsByIds(postIds: string[], viewerId: string): Promise<HydratedPost[]> {
  if (postIds.length === 0) return [];

  const rows = await db.select().from(schema.posts).where(inArray(schema.posts.id, postIds));
  const visible = rows.filter((p) => p.status !== 'deleted' && (p.status !== 'flagged' || p.authorId === viewerId));
  const rank = new Map(rows.map((p, i) => [p.id, i]));
  const posts = [...visible].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));

  const [likes, saves, votes] = await Promise.all([
    db.select().from(schema.postLikes).where(and(inArray(schema.postLikes.postId, postIds), eq(schema.postLikes.userId, viewerId))),
    db.select().from(schema.saves).where(and(inArray(schema.saves.postId, postIds), eq(schema.saves.userId, viewerId))),
    db.select().from(schema.postVotes).where(and(inArray(schema.postVotes.postId, postIds), eq(schema.postVotes.userId, viewerId))),
  ]);
  const likedSet = new Set(likes.map((l) => l.postId));
  const savedSet = new Set(saves.map((s) => s.postId));
  const voteMap = new Map(votes.map((v) => [v.postId, v.value]));

  return Promise.all(posts.map((p) => hydratePost(p, viewerId, { liked: likedSet.has(p.id), saved: savedSet.has(p.id), vote: voteMap.get(p.id) ?? 0 })));
}

/** POST /api/posts/:id/like — toggle. */
export async function toggleLike(userId: string, postId: string): Promise<{ liked: boolean; likes: number }> {
  const [post] = await db.select({ status: schema.posts.status, authorId: schema.posts.authorId }).from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post || post.status === 'deleted') throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');

  const existing = await db.select().from(schema.postLikes).where(and(eq(schema.postLikes.postId, postId), eq(schema.postLikes.userId, userId))).limit(1);
  if (existing[0]) {
    await db.delete(schema.postLikes).where(and(eq(schema.postLikes.postId, postId), eq(schema.postLikes.userId, userId)));
    await decrementCounter(postId, 'likes');
    return { liked: false, likes: await counterValue(postId, 'likes') };
  }

  try {
    await db.insert(schema.postLikes).values({ postId, userId });
  } catch {
    // contrainte UNIQUE : like simultané déjà présent
    return { liked: true, likes: await counterValue(postId, 'likes') };
  }
  await incrementCounter(postId, 'likes');
  await createNotification({
    userId: post.authorId,
    actorId: userId,
    type: 'like',
    action: 'post_liked',
    target: postId,
  });
  return { liked: true, likes: await counterValue(postId, 'likes') };
}

async function counterValue(postId: string, counter: 'likes' | 'saves' | 'shares' | 'comments' | 'views'): Promise<number> {
  const [post] = await db.select().from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  const deltas = await getCounterDeltas(postId);
  return (post?.[counter] ?? 0) + deltas[counter];
}

/** POST /api/posts/:id/comments. */
export async function addComment(userId: string, postId: string, input: CreateCommentInput): Promise<{ commentId: string }> {
  const [post] = await db.select({ status: schema.posts.status, authorId: schema.posts.authorId }).from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post || post.status === 'deleted') throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');

  if (input.parentId) {
    const [parent] = await db.select({ id: schema.comments.id }).from(schema.comments).where(and(eq(schema.comments.id, input.parentId), eq(schema.comments.postId, postId))).limit(1);
    if (!parent) throw AppError.notFound('Commentaire parent introuvable', 'PARENT_NOT_FOUND');
  }

  const moderation = moderateText(input.text);
  const [comment] = await db
    .insert(schema.comments)
    .values({ postId, userId, parentId: input.parentId ?? null, text: input.text, status: moderation.flag ? 'flagged' : 'published' })
    .returning();

  await incrementCounter(postId, 'comments');
  if (!comment) throw AppError.badRequest('Échec de création du commentaire', 'COMMENT_CREATE_FAILED');
  await enqueueModerationScan('comment', comment.id);
  await createNotification({
    userId: post.authorId,
    actorId: userId,
    type: 'comment',
    action: 'post_commented',
    target: postId,
    metadata: { commentId: comment.id },
  });
  return { commentId: comment.id };
}

/** GET /api/posts/:id/comments — pagination cursor. */
export async function listComments(postId: string, cursor: string | undefined, limit: number): Promise<{ comments: Array<Record<string, unknown>>; nextCursor: string | null }> {
  const [post] = await db.select({ status: schema.posts.status }).from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post || post.status === 'deleted') throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');

  const query = db
    .select({
      id: schema.comments.id,
      postId: schema.comments.postId,
      parentId: schema.comments.parentId,
      text: schema.comments.text,
      status: schema.comments.status,
      likes: schema.comments.likes,
      createdAt: schema.comments.createdAt,
      author: {
        id: schema.users.id,
        name: schema.users.name,
        username: schema.users.username,
        avatar: schema.users.avatar,
      },
    })
    .from(schema.comments)
    .innerJoin(schema.users, eq(schema.users.id, schema.comments.userId))
    .where(and(eq(schema.comments.postId, postId), eq(schema.comments.status, 'published'), cursor ? lt(schema.comments.createdAt, new Date(cursor)) : undefined))
    .orderBy(desc(schema.comments.createdAt))
    .limit(limit + 1);

  const rows = await query;
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const nextCursor = hasMore ? page[page.length - 1]?.createdAt.toISOString() ?? null : null;
  return { comments: page, nextCursor };
}

/** POST /api/posts/:id/share — une seule fois par utilisateur. */
export async function sharePost(userId: string, postId: string): Promise<{ shared: boolean; shares: number }> {
  const [post] = await db.select({ status: schema.posts.status }).from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post || post.status === 'deleted') throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');

  try {
    await db.insert(schema.shares).values({ postId, userId });
  } catch {
    return { shared: false, shares: await counterValue(postId, 'shares') };
  }
  await incrementCounter(postId, 'shares');
  return { shared: true, shares: await counterValue(postId, 'shares') };
}

/** POST /api/posts/:id/save — toggle signet. */
export async function toggleSave(userId: string, postId: string): Promise<{ saved: boolean; saves: number }> {
  const [post] = await db.select({ status: schema.posts.status }).from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post || post.status === 'deleted') throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');

  const existing = await db.select().from(schema.saves).where(and(eq(schema.saves.postId, postId), eq(schema.saves.userId, userId))).limit(1);
  if (existing[0]) {
    await db.delete(schema.saves).where(and(eq(schema.saves.postId, postId), eq(schema.saves.userId, userId)));
    await decrementCounter(postId, 'saves');
    return { saved: false, saves: await counterValue(postId, 'saves') };
  }
  await db.insert(schema.saves).values({ postId, userId });
  await incrementCounter(postId, 'saves');
  return { saved: true, saves: await counterValue(postId, 'saves') };
}

/** DELETE /api/posts/:id — soft delete (auteur ou admin). */
export async function deletePost(userId: string, postId: string): Promise<void> {
  const [post] = await db.select().from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post) throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');

  const isAuthor = post.authorId === userId;
  let isModerator = false;
  if (post.tribeId) {
    const [membership] = await db
      .select({ role: schema.tribeMembers.role })
      .from(schema.tribeMembers)
      .where(and(eq(schema.tribeMembers.tribeId, post.tribeId), eq(schema.tribeMembers.userId, userId)))
      .limit(1);
    isModerator = membership?.role === 'moderator' || membership?.role === 'owner';
  }

  if (!isAuthor && !isModerator) {
    throw AppError.forbidden('Vous ne pouvez pas supprimer ce post', 'POST_DELETE_FORBIDDEN');
  }

  await db.update(schema.posts).set({ status: 'deleted', deletedAt: new Date(), updatedAt: new Date() }).where(eq(schema.posts.id, postId));
  await redis.del(postCacheKey(postId));
}
