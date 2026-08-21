import { and, desc, eq, gt, inArray, lt, or } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { logger } from '../../middleware/logger';
import { enqueueModerationScan } from '../moderation/moderation.queue';

const STORY_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const viewedKey = (storyId: string) => `stories:viewed:${storyId}`;

export interface StoryDto {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  img: string;
  caption: string | null;
  type: 'image' | 'video';
  createdAt: string;
  expiresAt: string;
  isMine: boolean;
  viewed: boolean;
}

/** Sérialise une story avec les infos de son auteur. */
function toDto(row: schema.Story, mine: boolean, viewed: boolean, name: string, avatar: string | null): StoryDto {
  return {
    id: row.id,
    userId: row.userId,
    name,
    avatar,
    img: row.url,
    caption: row.caption,
    type: row.type,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    isMine: mine,
    viewed,
  };
}

/** POST /api/stories — crée une story (remplace l'active du user si < 24h). */
export async function createStory(
  userId: string,
  input: { img?: string; mediaUrl?: string; type?: 'image' | 'video'; caption?: string },
): Promise<StoryDto> {
  const url = input.mediaUrl ?? input.img;
  if (!url) throw AppError.badRequest('img ou mediaUrl est requis', 'STORY_MEDIA_REQUIRED');

  const now = new Date();

  // Max 1 story active : supprime les anciennes non expirées du même user
  await db.delete(schema.stories).where(and(eq(schema.stories.userId, userId), gt(schema.stories.expiresAt, now)));

  const [row] = await db
    .insert(schema.stories)
    .values({
      userId,
      type: input.type ?? 'image',
      url,
      caption: input.caption ?? null,
      expiresAt: new Date(now.getTime() + STORY_TTL_MS),
    })
    .returning();
  if (!row) throw AppError.badRequest('Échec de création de la story', 'STORY_CREATE_FAILED');
  await enqueueModerationScan('story', row.id);

  const [author] = await db.select({ name: schema.users.name, avatar: schema.users.avatar }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  return toDto(row, true, false, author?.name ?? '', author?.avatar ?? null);
}

/** GET /api/stories — ma story active + celles de mes connexions (follows/compagnons). */
export async function getStories(userId: string): Promise<StoryDto[]> {
  const now = new Date();

  const mine = await db
    .select()
    .from(schema.stories)
    .where(and(eq(schema.stories.userId, userId), gt(schema.stories.expiresAt, now)))
    .orderBy(desc(schema.stories.createdAt))
    .limit(1);

  const connectedIds = await connectedUserIds(userId);

  const others = connectedIds.length > 0
    ? await db
        .select()
        .from(schema.stories)
        .where(and(inArray(schema.stories.userId, connectedIds), gt(schema.stories.expiresAt, now)))
    : [];

  // Une story par connexion (la plus récente)
  const latestByUser = new Map<string, schema.Story>();
  for (const story of others) {
    const current = latestByUser.get(story.userId);
    if (!current || story.createdAt > current.createdAt) latestByUser.set(story.userId, story);
  }

  const authorIds = [...latestByUser.keys()];
  const authors = authorIds.length > 0
    ? await db
        .select({ id: schema.users.id, name: schema.users.name, avatar: schema.users.avatar })
        .from(schema.users)
        .where(inArray(schema.users.id, authorIds))
    : [];
  const authorByName = new Map(authors.map((a) => [a.id, a]));

  const results: StoryDto[] = [];
  for (const story of mine) {
    const [author] = await db.select({ name: schema.users.name, avatar: schema.users.avatar }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    results.push(toDto(story, true, false, author?.name ?? '', author?.avatar ?? null));
  }
  for (const [ownerId, story] of latestByUser) {
    const author = authorByName.get(ownerId);
    const viewed = await redis.sismember(viewedKey(story.id), userId);
    results.push(toDto(story, false, viewed === 1, author?.name ?? '', author?.avatar ?? null));
  }

  return results;
}

/** POST /api/stories/:id/view — enregistre une vue. */
export async function recordStoryView(userId: string, storyId: string): Promise<{ success: true; viewers: number }> {
  const [story] = await db.select().from(schema.stories).where(eq(schema.stories.id, storyId)).limit(1);
  if (!story) throw AppError.notFound('Story introuvable', 'STORY_NOT_FOUND');
  if (story.expiresAt.getTime() <= Date.now()) throw AppError.notFound('Story expirée', 'STORY_EXPIRED');

  const [row] = await db.update(schema.stories).set({ viewers: story.viewers + 1 }).where(eq(schema.stories.id, storyId)).returning({ viewers: schema.stories.viewers });
  await redis.sadd(viewedKey(storyId), userId);
  await redis.expire(viewedKey(storyId), 25 * 60 * 60);

  return { success: true, viewers: row?.viewers ?? story.viewers + 1 };
}

/** Récupère les IDs des connexions (compagnons + follows, les deux sens). */
async function connectedUserIds(userId: string): Promise<string[]> {
  const companionRows = await db
    .select({ fromUserId: schema.connections.fromUserId, toUserId: schema.connections.toUserId })
    .from(schema.connections)
    .where(
      or(
        and(eq(schema.connections.fromUserId, userId), eq(schema.connections.status, 'companion')),
        and(eq(schema.connections.toUserId, userId), eq(schema.connections.status, 'companion')),
      ),
    );

  const followRows = await db
    .select({ followerId: schema.follows.followerId, followingId: schema.follows.followingId })
    .from(schema.follows)
    .where(
      or(
        eq(schema.follows.followerId, userId),
        eq(schema.follows.followingId, userId),
      ),
    );

  const ids = new Set<string>();
  for (const r of companionRows) ids.add(r.fromUserId === userId ? r.toUserId : r.fromUserId);
  for (const r of followRows) ids.add(r.followerId === userId ? r.followingId : r.followingId === userId ? r.followerId : r.followingId);
  ids.delete(userId);
  return [...ids];
}

/** Purge des stories expirées (cron horaire + appel défensif au read). */
export async function cleanupExpiredStories(): Promise<number> {
  const expired = await db
    .select({ id: schema.stories.id })
    .from(schema.stories)
    .where(lt(schema.stories.expiresAt, new Date()));
  if (expired.length === 0) return 0;
  await db.delete(schema.stories).where(inArray(schema.stories.id, expired.map((s) => s.id)));
  return expired.length;
}

let cleanupTimer: NodeJS.Timeout | null = null;

/** Démarre le cron horaire de purge des stories expirées. */
export function startStoriesCleanup(intervalMs = 60 * 60 * 1000): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    cleanupExpiredStories()
      .then((n) => {
        if (n > 0) logger.info({ deleted: n }, 'stories expirées purgées');
      })
      .catch((err) => logger.error({ err: { message: String(err) } }, 'échec purge stories'));
  }, intervalMs);
  cleanupTimer.unref();
}

export function stopStoriesCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
