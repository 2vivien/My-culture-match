import { eq, and, lt, desc, inArray, ne, sql } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { extractHashtags, isValidPublicUrl } from '../../shared/utils/content';
import { moderatePost, moderateText } from './moderation';
import { incrementCounter, decrementCounter, getCounterDeltas } from '../feed/counters';
import { createNotification } from '../notifications/notifications.service';
import { enqueueFeedFanout, enqueueSearchIndex, enqueuePostEmbedding } from './posts.jobs';
import { enqueueModerationScan } from '../moderation/moderation.queue';
import { assertCanWriteInTribe } from '../tribes/tribes.sanctions.service';
import { postsCreatedTotal } from '../../infrastructure/monitoring/metrics';
import { assertCanReadTribePost, unreadableTribeIds } from '../tribes/tribes.access';
import type { CreatePostInput, CreateCommentInput } from './posts.schemas';
import { sortCommentTree, type CommentSort } from './comments.ranking';

/** Nombre maximal de commentaires chargés pour un tri classé (arbre calculé en mémoire). */
const MAX_RANKED_COMMENTS = 500;

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
  flair: { id: string; name: string; color: string } | null;
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
  /** Post original si type=Repost (hydraté : auteur + contenu complet). */
  originalPost: Omit<HydratedPost, 'originalPost'> | null;
  likedByMe: boolean;
  savedByMe: boolean;
  myVote: number;
  createdAt: string;
  updatedAt: string;
}

/** Crée une tradition ou un repost. Fanout + indexation + embedding en arrière-plan. */
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
  if (input.type === 'Repost') {
    if (!input.tribeId) throw AppError.badRequest('Choisissez une communauté pour reposter', 'TRIBE_REQUIRED');
    if (!input.originalPostId) throw AppError.badRequest('Post original manquant', 'ORIGINAL_POST_REQUIRED');
    const [original] = await db
      .select({ id: schema.posts.id, status: schema.posts.status, authorId: schema.posts.authorId, tribeId: schema.posts.tribeId })
      .from(schema.posts)
      .where(eq(schema.posts.id, input.originalPostId))
      .limit(1);
    if (!original || original.status === 'deleted') {
      throw AppError.notFound('Post original introuvable', 'POST_NOT_FOUND');
    }
    await assertCanReadTribePost(original.tribeId, userId);
    if (original.tribeId) {
      const [originTribe] = await db.select({ visibility: schema.tribes.visibility }).from(schema.tribes).where(eq(schema.tribes.id, original.tribeId)).limit(1);
      if (originTribe?.visibility === 'private') {
        throw AppError.forbidden('Un post d’une tribu privée ne peut pas être reposté', 'PRIVATE_REPOST_FORBIDDEN');
      }
    }
    if (original.authorId === userId) {
      throw AppError.badRequest('Vous ne pouvez pas reposter votre propre publication', 'SELF_REPOST_NOT_ALLOWED');
    }
  }

  if (input.tribeId) {
    const member = await db
      .select({ userId: schema.tribeMembers.userId })
      .from(schema.tribeMembers)
      .where(and(eq(schema.tribeMembers.tribeId, input.tribeId), eq(schema.tribeMembers.userId, userId)))
      .limit(1);
    if (!member[0]) throw AppError.forbidden('Vous devez être membre de cette tribu pour y poster', 'TRIBE_MEMBERSHIP_REQUIRED');
    await assertCanWriteInTribe(input.tribeId, userId);
  }
  if (input.flairId) {
    if (!input.tribeId) throw AppError.badRequest('Un flair nécessite une tribu', 'FLAIR_REQUIRES_TRIBE');
    const [flair] = await db.select({ id: schema.tribeFlairs.id }).from(schema.tribeFlairs).where(and(eq(schema.tribeFlairs.id, input.flairId), eq(schema.tribeFlairs.tribeId, input.tribeId))).limit(1);
    if (!flair) throw AppError.badRequest('Flair inconnu pour cette tribu', 'FLAIR_NOT_FOUND');
  }

  const moderation = moderatePost(input.title ?? '', input.body);
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
      flairId: input.flairId ?? null,
      type: input.type,
      title: input.title ?? null,
      body: input.body ?? null,
      mediaUrls: input.mediaUrls ?? [],
      linkUrl: input.linkUrl ?? null,
      tags,
      status,
      // Repost : référence du post original partagé.
      originalPostId: input.type === 'Repost' ? input.originalPostId ?? null : null,
      originalAuthorId:
        input.type === 'Repost' && input.originalPostId
          ? (await db
              .select({ authorId: schema.posts.authorId })
              .from(schema.posts)
              .where(eq(schema.posts.id, input.originalPostId))
              .limit(1))[0]?.authorId ?? null
          : null,
    })
    .returning();

  // Jobs async : fanout followers, indexation search, embedding post, scan modération
  if (!post) throw AppError.badRequest('Échec de création du post', 'POST_CREATE_FAILED');
  await enqueueFeedFanout(post.id, userId);
  // Les posts d'une tribu privée ne sont jamais indexés pour la recherche.
  const [tribeRow] = input.tribeId ? await db.select({ visibility: schema.tribes.visibility }).from(schema.tribes).where(eq(schema.tribes.id, input.tribeId)).limit(1) : [];
  if (status === 'published' && tribeRow?.visibility !== 'private') {
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

async function hydratePost(
  post: schema.Post,
  viewerId: string,
  rel: { liked: boolean; saved: boolean; vote: number },
  /** Anti-récursion : on n'hydrate pas l'original d'un original. */
  isOriginal = false,
): Promise<HydratedPost> {
  const [author] = await db.select().from(schema.users).where(eq(schema.users.id, post.authorId)).limit(1);
  const tribe = post.tribeId
    ? (await db.select().from(schema.tribes).where(eq(schema.tribes.id, post.tribeId)).limit(1))[0] ?? null
    : null;
  const flair = post.flairId
    ? (await db.select({ id: schema.tribeFlairs.id, name: schema.tribeFlairs.name, color: schema.tribeFlairs.color }).from(schema.tribeFlairs).where(eq(schema.tribeFlairs.id, post.flairId)).limit(1))[0] ?? null
    : null;
  const deltas = await getCounterDeltas(post.id);

  // Repost : hydrate le post original (auteur + contenu complet) pour l'affichage.
  let originalPost: HydratedPost['originalPost'] = null;
  if (!isOriginal && post.type === 'Repost' && post.originalPostId) {
    const [original] = await db
      .select()
      .from(schema.posts)
      .where(and(eq(schema.posts.id, post.originalPostId), ne(schema.posts.status, 'deleted')))
      .limit(1);
    // Reposts anciens d'un post devenu privé : l'original n'est exposé qu'à ceux qui peuvent le lire.
    const originalHidden = original?.tribeId ? (await unreadableTribeIds([original.tribeId], viewerId)).has(original.tribeId) : false;
    if (original && !originalHidden) {
      const origRel = await postRelations(original.id, viewerId);
      originalPost = await hydratePost(original, viewerId, origRel, true);
    }
  }

  return {
    id: post.id,
    author: author
      ? { id: author.id, name: author.name, username: author.username, avatar: author.avatar, level: author.level, glow: author.glow }
      : { id: post.authorId, name: 'Utilisateur', username: 'user', avatar: null, level: 1, glow: 'none' },
    tribe: tribe ? { id: tribe.id, name: tribe.name, tag: tribe.tag ?? '' } : null,
    flair,
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
    originalPost,
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
      await assertCanReadTribePost(post.tribeId, viewerId);
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
  await assertCanReadTribePost(post.tribeId, viewerId);

  await redis.set(postCacheKey(postId), JSON.stringify(post), 'EX', POST_CACHE_TTL);
  const rel = await postRelations(postId, viewerId);
  return hydratePost(post, viewerId, rel);
}

/** Hydratation groupée (feed) : exclut supprimés + flagged hors auteur. */
export async function getPostsByIds(postIds: string[], viewerId: string): Promise<HydratedPost[]> {
  if (postIds.length === 0) return [];

  const rows = await db.select().from(schema.posts).where(inArray(schema.posts.id, postIds));
  const hiddenTribes = await unreadableTribeIds(rows.map((p) => p.tribeId).filter((id): id is string => Boolean(id)), viewerId);
  const visible = rows.filter((p) => p.status !== 'deleted' && (p.status !== 'flagged' || p.authorId === viewerId) && !(p.tribeId && hiddenTribes.has(p.tribeId)));
  // L'ordre des ids reçus fait foi (tri hot/top/épinglage, feed classé) ; la lecture SQL `inArray` n'a pas d'ordre garanti.
  const rank = new Map(postIds.map((id, i) => [id, i]));
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
  const [post] = await db.select({ status: schema.posts.status, authorId: schema.posts.authorId, tribeId: schema.posts.tribeId }).from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post || post.status === 'deleted') throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');
  await assertCanReadTribePost(post.tribeId, userId);

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
  const [post] = await db.select({ status: schema.posts.status, authorId: schema.posts.authorId, tribeId: schema.posts.tribeId }).from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post || post.status === 'deleted') throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');
  await assertCanReadTribePost(post.tribeId, userId);
  if (post.tribeId) await assertCanWriteInTribe(post.tribeId, userId);

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

/**
 * GET /api/posts/:id/comments.
 * `new` : pagination par curseur de date (comportement historique). Les autres tris renvoient l'arbre
 * (racines puis réponses) trié par `best` / `top` / `old` ; le curseur est alors un décalage numérique.
 * Chaque commentaire porte `ups`, `downs`, `score` et le vote du lecteur (`myVote`).
 */
export async function listComments(postId: string, cursor: string | undefined, limit: number, viewerId: string, sort: CommentSort = 'new'): Promise<{ comments: Array<Record<string, unknown>>; nextCursor: string | null }> {
  const [post] = await db.select({ status: schema.posts.status, tribeId: schema.posts.tribeId }).from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post || post.status === 'deleted') throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');
  await assertCanReadTribePost(post.tribeId, viewerId);

  const baseSelect = {
    id: schema.comments.id,
    postId: schema.comments.postId,
    parentId: schema.comments.parentId,
    text: schema.comments.text,
    status: schema.comments.status,
    likes: schema.comments.likes,
    createdAt: schema.comments.createdAt,
    author: { id: schema.users.id, name: schema.users.name, username: schema.users.username, avatar: schema.users.avatar },
  };
  const visible = and(eq(schema.comments.postId, postId), eq(schema.comments.status, 'published'));

  let rows;
  let nextCursor: string | null = null;
  if (sort === 'new') {
    const fetched = await db.select(baseSelect).from(schema.comments).innerJoin(schema.users, eq(schema.users.id, schema.comments.userId))
      .where(and(visible, cursor ? lt(schema.comments.createdAt, new Date(cursor)) : undefined))
      .orderBy(desc(schema.comments.createdAt)).limit(limit + 1);
    rows = fetched.slice(0, limit);
    nextCursor = fetched.length > limit ? rows[rows.length - 1]?.createdAt.toISOString() ?? null : null;
  } else {
    rows = await db.select(baseSelect).from(schema.comments).innerJoin(schema.users, eq(schema.users.id, schema.comments.userId))
      .where(visible).orderBy(desc(schema.comments.createdAt)).limit(MAX_RANKED_COMMENTS);
  }

  const ids = rows.map((r) => r.id);
  const tallies = ids.length > 0
    ? await db.select({ commentId: schema.commentVotes.commentId, ups: sql<number>`COUNT(*) FILTER (WHERE value = 1)::int`, downs: sql<number>`COUNT(*) FILTER (WHERE value = -1)::int` })
        .from(schema.commentVotes).where(inArray(schema.commentVotes.commentId, ids)).groupBy(schema.commentVotes.commentId)
    : [];
  const mine = viewerId && ids.length > 0
    ? await db.select({ commentId: schema.commentVotes.commentId, value: schema.commentVotes.value }).from(schema.commentVotes)
        .where(and(inArray(schema.commentVotes.commentId, ids), eq(schema.commentVotes.userId, viewerId)))
    : [];
  const tallyBy = new Map(tallies.map((t) => [t.commentId, t]));
  const myVoteBy = new Map(mine.map((m) => [m.commentId, m.value]));
  const withVotes = rows.map((r) => {
    const t = tallyBy.get(r.id);
    const ups = t?.ups ?? 0;
    const downs = t?.downs ?? 0;
    return { ...r, ups, downs, score: ups - downs, myVote: myVoteBy.get(r.id) ?? 0 };
  });

  if (sort === 'new') return { comments: withVotes, nextCursor };

  const ordered = sortCommentTree(withVotes, sort);
  const offset = cursor && /^\d+$/.test(cursor) ? Number(cursor) : 0;
  const page = ordered.slice(offset, offset + limit);
  return { comments: page, nextCursor: offset + limit < ordered.length ? String(offset + limit) : null };
}

/** POST /api/posts/:id/comments/:commentId/vote — bascule +1 / -1 (même valeur = retrait). */
export async function voteComment(userId: string, postId: string, commentId: string, value: 1 | -1): Promise<{ myVote: number; score: number; ups: number; downs: number }> {
  // Mêmes garde-fous que la lecture et que addComment : post visible, commentaire publié, pas de sanction de tribu.
  const [post] = await db.select({ status: schema.posts.status, tribeId: schema.posts.tribeId }).from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post || post.status === 'deleted') throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');
  const [comment] = await db.select({ id: schema.comments.id, status: schema.comments.status }).from(schema.comments)
    .where(and(eq(schema.comments.id, commentId), eq(schema.comments.postId, postId))).limit(1);
  if (!comment || comment.status !== 'published') throw AppError.notFound('Commentaire introuvable', 'COMMENT_NOT_FOUND');
  if (post.tribeId) await assertCanWriteInTribe(post.tribeId, userId);

  const [existing] = await db.select().from(schema.commentVotes)
    .where(and(eq(schema.commentVotes.commentId, commentId), eq(schema.commentVotes.userId, userId))).limit(1);
  if (existing && existing.value === value) {
    await db.delete(schema.commentVotes).where(and(eq(schema.commentVotes.commentId, commentId), eq(schema.commentVotes.userId, userId)));
  } else {
    await db.insert(schema.commentVotes).values({ commentId, userId, value })
      .onConflictDoUpdate({ target: [schema.commentVotes.commentId, schema.commentVotes.userId], set: { value, updatedAt: new Date() } });
  }

  const [t] = await db.select({ ups: sql<number>`COUNT(*) FILTER (WHERE value = 1)::int`, downs: sql<number>`COUNT(*) FILTER (WHERE value = -1)::int` })
    .from(schema.commentVotes).where(eq(schema.commentVotes.commentId, commentId));
  const ups = t?.ups ?? 0;
  const downs = t?.downs ?? 0;
  return { myVote: existing && existing.value === value ? 0 : value, score: ups - downs, ups, downs };
}

/** POST /api/posts/:id/share — une seule fois par utilisateur. */
export async function sharePost(userId: string, postId: string): Promise<{ shared: boolean; shares: number }> {
  const [post] = await db.select({ status: schema.posts.status, tribeId: schema.posts.tribeId }).from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post || post.status === 'deleted') throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');
  await assertCanReadTribePost(post.tribeId, userId);

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
  const [post] = await db.select({ status: schema.posts.status, tribeId: schema.posts.tribeId }).from(schema.posts).where(eq(schema.posts.id, postId)).limit(1);
  if (!post || post.status === 'deleted') throw AppError.notFound('Post introuvable', 'POST_NOT_FOUND');
  await assertCanReadTribePost(post.tribeId, userId);

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

/** GET /api/posts/saves/list — posts enregistrés par l'utilisateur. */
export async function listSaves(userId: string, limit = 50): Promise<HydratedPost[]> {
  const rows = await db
    .select({ postId: schema.saves.postId, createdAt: schema.saves.createdAt })
    .from(schema.saves)
    .where(eq(schema.saves.userId, userId))
    .orderBy(desc(schema.saves.createdAt))
    .limit(limit);
  if (rows.length === 0) return [];
  return getPostsByIds(
    rows.map((r) => r.postId),
    userId,
  );
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
