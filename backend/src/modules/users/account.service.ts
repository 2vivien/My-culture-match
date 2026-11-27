import { eq, or } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { meilisearch } from '../../infrastructure/meilisearch';
import { logger } from '../../middleware/logger';
import { AppError } from '../../shared/utils/AppError';
import { revokeAllUserSessions } from '../auth/session.service';
import { redactForExport } from './account.export';
import { userLocationSettings } from '../location/location.schema';

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

/**
 * DELETE /api/users/me — effacement du compte (droit à l'effacement).
 * Les clés étrangères en cascade suppriment profil, contenus, relations et réglages ; les sessions sont
 * révoquées, les références de modération conservées sans lien nominatif, l'index de recherche purgé.
 * Les fichiers médias (MinIO) ne sont pas encore supprimés : voir issue de suivi.
 */
export async function deleteAccount(userId: string): Promise<{ deleted: true }> {
  const [user] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');

  const ownedPosts = await db.select({ id: schema.posts.id }).from(schema.posts).where(eq(schema.posts.authorId, userId));
  await revokeAllUserSessions(userId);

  await db.transaction(async (tx) => {
    // `reports.moderator_id` n'a pas de ON DELETE : on détache la référence pour ne pas bloquer l'effacement.
    await tx.update(schema.reports).set({ moderatorId: null }).where(eq(schema.reports.moderatorId, userId));
    await tx.delete(schema.users).where(eq(schema.users.id, userId));
  });

  await purgeSecondaryStores(userId, ownedPosts.map((p) => p.id));
  logger.info({ userId }, 'compte supprimé');
  return { deleted: true };
}
