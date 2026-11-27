import { eq, or, sql } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { meilisearch } from '../../infrastructure/meilisearch';
import { logger } from '../../middleware/logger';
import { AppError } from '../../shared/utils/AppError';
import { revokeAllUserSessions } from '../auth/session.service';
import { redactForExport } from './account.export';
import { userLocationSettings } from '../location/location.schema';
import { mediaModeration } from '../safety/safety.schema';
import { env } from '../../config/env';
import { buildMediaBases, collectOwnedObjectKeys, runMediaCleanup } from './account.media';
import { enqueueAccountMediaCleanup, minioStorage } from './account-cleanup.queue';

const POSTS_INDEX = 'posts';
const ROW_LIMIT = 10_000;

/**
 * GET /api/users/me/export — copie lisible des données personnelles (droit d'accès / portabilité).
 * Les secrets et empreintes internes sont retirés ; les messages exportés sont ceux que la personne a écrits.
 */
export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  const [profile] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!profile) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');

  const [settings, consent, locationSettings, posts, comments, messagesSent, connections, loveMatches, blocks, notifications, stories, tribes] = await Promise.all([
    db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId)).limit(1),
    db.select().from(schema.consentSettings).where(eq(schema.consentSettings.userId, userId)).limit(1),
    db.select().from(userLocationSettings).where(eq(userLocationSettings.userId, userId)).limit(1),
    db.select().from(schema.posts).where(eq(schema.posts.authorId, userId)).limit(ROW_LIMIT),
    db.select().from(schema.comments).where(eq(schema.comments.userId, userId)).limit(ROW_LIMIT),
    db.select().from(schema.messages).where(eq(schema.messages.senderId, userId)).limit(ROW_LIMIT),
    db.select().from(schema.connections).where(or(eq(schema.connections.fromUserId, userId), eq(schema.connections.toUserId, userId))).limit(ROW_LIMIT),
    db.select().from(schema.loveMatches).where(eq(schema.loveMatches.userId, userId)).limit(ROW_LIMIT),
    db.select().from(schema.blocks).where(eq(schema.blocks.blockerId, userId)).limit(ROW_LIMIT),
    db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId)).limit(ROW_LIMIT),
    db.select().from(schema.stories).where(eq(schema.stories.userId, userId)).limit(ROW_LIMIT),
    db.select().from(schema.tribeMembers).where(eq(schema.tribeMembers.userId, userId)).limit(ROW_LIMIT),
  ]);

  return redactForExport({
    exportedAt: new Date(),
    format: 'mcm-export/1',
    profile,
    settings: settings[0] ?? null,
    consent: consent[0] ?? null,
    locationSettings: locationSettings[0] ?? null,
    posts, comments, messagesSent, connections, loveMatches, blocks, notifications, stories, tribes,
  });
}

/** Meilisearch / Redis : nettoyage au mieux, une indisponibilité ne doit pas bloquer l'effacement en base. */
async function purgeSecondaryStores(userId: string, postIds: string[]): Promise<void> {
  try {
    if (postIds.length > 0) await meilisearch.index(POSTS_INDEX).deleteDocuments(postIds);
  } catch (err) {
    logger.warn({ err: { message: String(err) }, userId }, 'suppression de compte : index de recherche non purgé');
  }
  try {
    const keys = [
      `feed:${userId}`, `location:settings:${userId}`, `presence:${userId}`,
      `love:candidates:${userId}`, `love:swiped:${userId}`, `love:passed:${userId}`, `love:search:quota:${userId}`,
    ];
    await redis.del(...keys);
  } catch (err) {
    logger.warn({ err: { message: String(err) }, userId }, 'suppression de compte : clés Redis non purgées');
  }
}

/** Lecture au mieux d'une colonne d'URLs : une table absente ne doit pas bloquer l'effacement (le balayage par préfixe rattrape). */
async function readUrls(label: string, query: () => Promise<unknown[]>): Promise<unknown[]> {
  try {
    return await query();
  } catch (err) {
    logger.warn({ err: { message: String(err) }, source: label }, 'suppression de compte : recensement média partiel');
    return [];
  }
}

/** Toutes les URLs de médias référencées en base pour cette personne (avant que les cascades ne les effacent). */
async function collectMediaUrls(userId: string): Promise<unknown[]> {
  const rows = <T>(r: unknown): T[] => r as T[];
  const lists = await Promise.all([
    readUrls('users', async () => rows<{ a: string | null; b: string | null }>(await db.select({ a: schema.users.avatar, b: schema.users.banner }).from(schema.users).where(eq(schema.users.id, userId))).flatMap((r) => [r.a, r.b])),
    readUrls('tribes', async () => rows<{ a: string | null; b: string | null }>(await db.select({ a: schema.tribes.avatar, b: schema.tribes.banner }).from(schema.tribes).where(eq(schema.tribes.createdById, userId))).flatMap((r) => [r.a, r.b])),
    readUrls('posts', async () => rows<{ i: string | null; m: string[] | null }>(await db.select({ i: schema.posts.image, m: schema.posts.mediaUrls }).from(schema.posts).where(eq(schema.posts.authorId, userId))).flatMap((r) => [r.i, r.m])),
    readUrls('stories', async () => (await db.select({ u: schema.stories.url }).from(schema.stories).where(eq(schema.stories.userId, userId))).map((r) => r.u)),
    readUrls('messages', async () => (await db.select({ u: schema.messages.mediaUrl }).from(schema.messages).where(eq(schema.messages.senderId, userId))).map((r) => r.u)),
    readUrls('media_moderation', async () => (await db.select({ u: mediaModeration.mediaUrl }).from(mediaModeration).where(eq(mediaModeration.ownerId, userId))).map((r) => r.u)),
    readUrls('temporal_messages', async () => rows<{ u: string | null }>(await db.execute(sql`SELECT media_url AS u FROM temporal_messages WHERE sender_id = ${userId}`)).map((r) => r.u)),
    readUrls('relationship_capsules', async () => rows<{ u: unknown }>(await db.execute(sql`SELECT media_urls AS u FROM relationship_capsules WHERE author_user_id = ${userId}`)).map((r) => r.u)),
  ]);
  return lists.flat();
}

/**
 * Supprime les fichiers MinIO une fois la suppression en base validée : file BullMQ (réessais, en tâche de fond) ;
 * si Redis refuse le job, tentative directe. Aucun échec ici ne remet en cause l'effacement du compte.
 */
async function scheduleMediaCleanup(userId: string, keys: string[]): Promise<void> {
  try {
    await enqueueAccountMediaCleanup({ userId, keys });
    logger.info({ event: 'account.media_cleanup_enqueued', keys: keys.length }, 'suppression des fichiers de compte planifiée');
    return;
  } catch (err) {
    logger.error({ event: 'account.media_cleanup_enqueue_failed', errName: (err as Error).name }, 'file de nettoyage indisponible : suppression directe');
  }
  try {
    const res = await runMediaCleanup({ userId, keys }, minioStorage);
    logger.info({ event: 'account.media_cleanup', removed: res.removed, skipped: res.skipped, direct: true }, 'fichiers de compte supprimés');
  } catch (err) {
    logger.error({ event: 'account.media_cleanup_failed', final: true, direct: true, errName: (err as Error).name }, 'suppression des fichiers de compte échouée');
  }
}

/**
 * DELETE /api/users/me — effacement du compte (droit à l'effacement).
 * Les clés étrangères en cascade suppriment profil, contenus, relations et réglages ; les sessions sont
 * révoquées, les références de modération conservées sans lien nominatif, l'index de recherche purgé.
 * Les fichiers médias (MinIO) sont recensés avant la transaction puis supprimés après le commit (file BullMQ).
 */
export async function deleteAccount(userId: string): Promise<{ deleted: true }> {
  const [user] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');

  const ownedPosts = await db.select({ id: schema.posts.id }).from(schema.posts).where(eq(schema.posts.authorId, userId));
  const mediaKeys = collectOwnedObjectKeys(
    await collectMediaUrls(userId),
    userId,
    buildMediaBases({ endpoint: env.MINIO_ENDPOINT, port: env.MINIO_PORT, useSSL: env.MINIO_USE_SSL ?? false, bucket: env.MINIO_BUCKET_NAME, publicBaseUrl: env.MEDIA_PUBLIC_URL }),
  );
  await revokeAllUserSessions(userId);

  await db.transaction(async (tx) => {
    // `reports.moderator_id` n'a pas de ON DELETE : on détache la référence pour ne pas bloquer l'effacement.
    await tx.update(schema.reports).set({ moderatorId: null }).where(eq(schema.reports.moderatorId, userId));
    // `media_moderation.owner_id` n'a pas de clé étrangère : on retire ces lignes (elles référencent les fichiers).
    await tx.delete(mediaModeration).where(eq(mediaModeration.ownerId, userId));
    await tx.delete(schema.users).where(eq(schema.users.id, userId));
  });

  await purgeSecondaryStores(userId, ownedPosts.map((p) => p.id));
  await scheduleMediaCleanup(userId, mediaKeys);
  logger.info({ userId }, 'compte supprimé');
  return { deleted: true };
}
