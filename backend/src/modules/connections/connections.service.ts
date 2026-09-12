import { and, eq, or, inArray, isNotNull } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { createNotification } from '../notifications/notifications.service';
import { hashEmbedding, tokenize, cosineSimilarity } from '../culture-engine/embedding';
import { emitToUser } from '../../infrastructure/websocket';

const SUGGESTIONS_PER_DAY = 20;
const DECLINED_TTL = 30 * 24 * 60 * 60; // 30j
const SUGGESTIONS_DAILY_KEY = 'suggestions:daily:';

const companionsKey = (userId: string) => `connections:${userId}`;
const blockedKey = (userId: string) => `blocked:${userId}`;

export interface ProfileDto {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  matchScore: number;
}

export interface ConnectionDto {
  profile: ProfileDto;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionDto {
  profile: ProfileDto;
  reason: string;
  sharedTraits: string[];
}

/** Sérialise un profil pour les listes de connexions (sans données sensibles). */
function toProfile(row: {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
}, matchScore: number): ProfileDto {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    avatar: row.avatar,
    bio: row.bio,
    location: row.location,
    country: row.country,
    matchScore,
  };
}

async function blockedIds(userId: string): Promise<string[]> {
  const cached = await redis.smembers(blockedKey(userId));
  if (cached.length > 0) return cached;

  const rows = await db.select({ blockedId: schema.blocks.blockedId }).from(schema.blocks).where(eq(schema.blocks.blockerId, userId));
  const ids = rows.map((r) => r.blockedId);
  if (ids.length > 0) await redis.sadd(blockedKey(userId), ids);
  return ids;
}

async function isBlockedBetween(a: string, b: string): Promise<boolean> {
  const rows = await db
    .select({ blockerId: schema.blocks.blockerId })
    .from(schema.blocks)
    .where(
      or(
        and(eq(schema.blocks.blockerId, a), eq(schema.blocks.blockedId, b)),
        and(eq(schema.blocks.blockerId, b), eq(schema.blocks.blockedId, a)),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Score de compat culturel entre deux profils (Culture Engine). */
export function cultureScore(a: { values?: string[] | null; languages?: string[] | null; ethnicity?: string | null }, b: { values?: string[] | null; languages?: string[] | null; ethnicity?: string | null }): number {
  const tokensA = tokenize([...(a.values ?? []), ...(a.languages ?? []), a.ethnicity ?? ''].join(' '));
  const tokensB = tokenize([...(b.values ?? []), ...(b.languages ?? []), b.ethnicity ?? ''].join(' '));
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const vecA = hashEmbedding(tokensA);
  const vecB = hashEmbedding(tokensB);
  return Math.round(cosineSimilarity(vecA, vecB) * 100);
}

/** GET /api/connections/suggestions — profils recommandés (max 20/jour). */
export async function getSuggestions(userId: string): Promise<{ suggestions: SuggestionDto[]; remaining: number }> {
  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user[0]) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');

  const dailyKey = `${SUGGESTIONS_DAILY_KEY}${userId}`;
  const shown = Number((await redis.get(dailyKey)) ?? 0);
  if (shown >= SUGGESTIONS_PER_DAY) return { suggestions: [], remaining: 0 };

  const blocked = await blockedIds(userId);
  const [me] = user;

  const existing = await db
    .select({
      toUserId: schema.connections.toUserId,
      fromUserId: schema.connections.fromUserId,
      status: schema.connections.status,
    })
    .from(schema.connections)
    .where(or(eq(schema.connections.fromUserId, userId), eq(schema.connections.toUserId, userId)));

  const connected = new Set<string>();
  const declined = new Set<string>();
  for (const row of existing) {
    const other = row.fromUserId === userId ? row.toUserId : row.fromUserId;
    if (row.status === 'suggestion') continue;
    connected.add(other);
    if (row.status === 'blocked') connected.add(other);
  }
  const declinedCached = await redis.smembers(`declined:${userId}`);
  declinedCached.forEach((id) => declined.add(id));

  const candidates = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      username: schema.users.username,
      avatar: schema.users.avatar,
      bio: schema.users.bio,
      location: schema.users.location,
      country: schema.users.country,
      values: schema.users.values,
      languages: schema.users.languages,
      ethnicity: schema.users.ethnicity,
      profileCompleted: schema.users.profileCompleted,
    })
    .from(schema.users)
    .where(eq(schema.users.profileCompleted, true))
    .limit(200);

  const notIn = new Set([userId, ...blocked, ...connected, ...declined]);
  const pool = candidates.filter((c) => !notIn.has(c.id));

  const suggestions: SuggestionDto[] = pool
    .slice(0, SUGGESTIONS_PER_DAY - shown)
    .map((candidate) => {
      const score = cultureScore(me, candidate);
      const sharedValues = (candidate.values ?? []).filter((v) => (me.values ?? []).includes(v));
      return {
        profile: toProfile(candidate, score),
        reason: 'Suggestions basées sur vos valeurs et affinités culturelles',
        sharedTraits: sharedValues.slice(0, 3),
      };
    });

  if (suggestions.length > 0) {
    const existingCount = suggestions.length;
    const suggestionRows = suggestions.map((s) => ({
      fromUserId: userId,
      toUserId: s.profile.id,
      status: 'suggestion' as const,
      matchScore: s.profile.matchScore,
    }));
    await db.insert(schema.connections).values(suggestionRows).onConflictDoNothing();
    await redis.set(dailyKey, String(shown + existingCount), 'EX', 24 * 60 * 60);
  }

  return { suggestions, remaining: Math.max(0, SUGGESTIONS_PER_DAY - shown - suggestions.length) };
}

function toConnectionDto(p: {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
}, matchScore: number, status: string, createdAt: Date, updatedAt: Date): ConnectionDto {
  return { profile: toProfile(p, matchScore), status, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() };
}

async function toConnectionProfile(userId: string, matchScore: number, status: string, createdAt: Date, updatedAt: Date): Promise<ConnectionDto | null> {
  const [p] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      username: schema.users.username,
      avatar: schema.users.avatar,
      bio: schema.users.bio,
      location: schema.users.location,
      country: schema.users.country,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!p) return null;
  return toConnectionDto(p, matchScore, status, createdAt, updatedAt);
}

/** GET /api/connections/interested — profils qui m'ont montré de l'intérêt. */
export async function getInterested(userId: string): Promise<ConnectionDto[]> {
  const rows = await db
    .select({
      fromUserId: schema.connections.fromUserId,
      createdAt: schema.connections.createdAt,
      updatedAt: schema.connections.updatedAt,
      matchScore: schema.connections.matchScore,
    })
    .from(schema.connections)
    .where(and(eq(schema.connections.toUserId, userId), eq(schema.connections.status, 'interested')));

  const profiles = await Promise.all(
    rows.map((row) => toConnectionProfile(row.fromUserId, row.matchScore, 'interested', row.createdAt, row.updatedAt)),
  );

  return profiles.filter((p): p is ConnectionDto => p !== null);
}

/** GET /api/connections/requests — demandes reçues. */
export async function getRequests(userId: string): Promise<ConnectionDto[]> {
  const rows = await db
    .select({
      fromUserId: schema.connections.fromUserId,
      matchScore: schema.connections.matchScore,
      createdAt: schema.connections.createdAt,
      updatedAt: schema.connections.updatedAt,
    })
    .from(schema.connections)
    .where(and(eq(schema.connections.toUserId, userId), eq(schema.connections.status, 'request')));

  const profiles = await Promise.all(
    rows.map((row) => toConnectionProfile(row.fromUserId, row.matchScore, 'request', row.createdAt, row.updatedAt)),
  );

  return profiles.filter((p): p is ConnectionDto => p !== null);
}

/** GET /api/connections/companions — connexions établies. */
export async function getCompanions(userId: string): Promise<ConnectionDto[]> {
  const rows = await db
    .select({
      otherId: schema.connections.fromUserId,
      matchScore: schema.connections.matchScore,
      createdAt: schema.connections.createdAt,
      updatedAt: schema.connections.updatedAt,
    })
    .from(schema.connections)
    .where(and(eq(schema.connections.toUserId, userId), eq(schema.connections.status, 'companion')));

  const reversed = await db
    .select({
      otherId: schema.connections.toUserId,
      matchScore: schema.connections.matchScore,
      createdAt: schema.connections.createdAt,
      updatedAt: schema.connections.updatedAt,
    })
    .from(schema.connections)
    .where(and(eq(schema.connections.fromUserId, userId), eq(schema.connections.status, 'companion')));

  const all = [...rows, ...reversed];
  const profiles = await Promise.all(
    all.map((row) => toConnectionProfile(row.otherId, row.matchScore, 'companion', row.createdAt, row.updatedAt)),
  );

  return profiles.filter((p): p is ConnectionDto => p !== null);
}

/**
 * GET /api/connections/nearby — amis visibles sur la carte proximity :
 *  - connexions établies (companion) OU suggestions (bubble Snap) ;
 *  - partage de localisation activé chez eux ET chez moi ;
 *  - distance en km via Haversine.
 */
export async function getNearbyFriends(
  userId: string,
): Promise<{
  me: { latitude: number | null; longitude: number | null; locationSharingEnabled: boolean };
  friends: Array<ProfileDto & { latitude: number; longitude: number; distanceKm: number | null; lastSeen: string | null; isCompanion: boolean }>;
}> {
  const [me] = await db
    .select({
      latitude: schema.users.latitude,
      longitude: schema.users.longitude,
      locationSharingEnabled: schema.users.locationSharingEnabled,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  // Mon partage désactivé → carte vide (comme Snap : personne ne me voit)
  if (!me?.locationSharingEnabled || me.latitude === null || me.longitude === null) {
    return { me: { latitude: null, longitude: null, locationSharingEnabled: false }, friends: [] };
  }

  const { haversineKm } = await import('../users/users.service');

  // Amis (companion) avec géoloc activée + suggestions proches (bubble)
  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      username: schema.users.username,
      avatar: schema.users.avatar,
      bio: schema.users.bio,
      location: schema.users.location,
      country: schema.users.country,
      latitude: schema.users.latitude,
      longitude: schema.users.longitude,
      locationUpdatedAt: schema.users.locationUpdatedAt,
      status: schema.connections.status,
    })
    .from(schema.connections)
    .innerJoin(schema.users, eq(schema.users.id, schema.connections.toUserId))
    .where(
      and(
        eq(schema.connections.fromUserId, userId),
        inArray(schema.connections.status, ['companion', 'suggestion', 'interested']),
        eq(schema.users.locationSharingEnabled, true),
        isNotNull(schema.users.latitude),
        isNotNull(schema.users.longitude),
      ),
    )
    .limit(200);

  const friends = rows
    .filter((r) => r.latitude !== null && r.longitude !== null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      username: r.username,
      avatar: r.avatar,
      bio: r.bio,
      location: r.location,
      country: r.country,
      matchScore: 0,
      latitude: r.latitude as number,
      longitude: r.longitude as number,
      distanceKm: haversineKm(me.latitude as number, me.longitude as number, r.latitude as number, r.longitude as number),
      lastSeen: r.locationUpdatedAt ? r.locationUpdatedAt.toISOString() : null,
      isCompanion: r.status === 'companion',
    }));

  return { me: { latitude: me.latitude, longitude: me.longitude, locationSharingEnabled: true }, friends };
}

/** POST /api/connections/:userId/request — envoyer une demande. */
export async function sendRequest(userId: string, targetId: string): Promise<{ success: true }> {
  if (userId === targetId) throw AppError.badRequest('Impossible de s’envoyer une demande', 'SELF_REQUEST');
  if (await isBlockedBetween(userId, targetId)) {
    throw AppError.forbidden('Action impossible', 'BLOCKED');
  }

  const [target] = await db.select().from(schema.users).where(eq(schema.users.id, targetId)).limit(1);
  if (!target) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');

  const existing = await db
    .select()
    .from(schema.connections)
    .where(or(and(eq(schema.connections.fromUserId, userId), eq(schema.connections.toUserId, targetId)), and(eq(schema.connections.fromUserId, targetId), eq(schema.connections.toUserId, userId))));

  if (existing.some((r) => r.status === 'companion')) throw AppError.conflict('Déjà compagnon', 'ALREADY_COMPANION');
  if (existing.some((r) => r.status === 'request')) throw AppError.conflict('Demande déjà envoyée', 'REQUEST_ALREADY_SENT');
  if (existing.some((r) => r.status === 'blocked')) throw AppError.forbidden('Action impossible', 'BLOCKED');

  // Si B a montré de l'intérêt → compagnon direct
  const interest = existing.find((r) => r.fromUserId === targetId && r.toUserId === userId && r.status === 'interested');
  if (interest) {
    await db
      .update(schema.connections)
      .set({ status: 'companion', updatedAt: new Date() })
      .where(and(eq(schema.connections.fromUserId, targetId), eq(schema.connections.toUserId, userId)));
    await redis.sadd(companionsKey(userId), targetId);
    await redis.sadd(companionsKey(targetId), userId);
    await createNotification({ userId: targetId, actorId: userId, type: 'request', action: 'accept', target: userId });
    await createNotification({ userId, actorId: targetId, type: 'request', action: 'accept', target: targetId });
    emitToUser(targetId, 'connections:companion', { userId, companion: true });
    emitToUser(userId, 'connections:companion', { userId: targetId, companion: true });
    return { success: true };
  }

  // Update suggestion → request, sinon création
  const existingRow = existing[0];
  if (existingRow) {
    const isMine = existingRow.fromUserId === userId;
    await db
      .update(schema.connections)
      .set({ status: 'request', updatedAt: new Date() })
      .where(and(eq(schema.connections.fromUserId, isMine ? userId : targetId), eq(schema.connections.toUserId, isMine ? targetId : userId)));
  } else {
    await db.insert(schema.connections).values({ fromUserId: userId, toUserId: targetId, status: 'request', matchScore: 0 });
  }

  await createNotification({ userId: targetId, actorId: userId, type: 'request', action: 'request', target: userId });
  emitToUser(targetId, 'connections:request', { userId });

  return { success: true };
}

/** POST /api/requests/:id/accept — accepter une demande reçue. */
export async function acceptRequest(userId: string, requestId: string): Promise<{ success: true }> {
  const [row] = await db
    .select()
    .from(schema.connections)
    .where(and(eq(schema.connections.fromUserId, requestId), eq(schema.connections.toUserId, userId), eq(schema.connections.status, 'request')))
    .limit(1);
  if (!row) throw AppError.notFound('Demande introuvable', 'REQUEST_NOT_FOUND');

  await db
    .update(schema.connections)
    .set({ status: 'companion', updatedAt: new Date() })
    .where(and(eq(schema.connections.fromUserId, requestId), eq(schema.connections.toUserId, userId)));
  await redis.sadd(companionsKey(userId), requestId);
  await redis.sadd(companionsKey(requestId), userId);

  await createNotification({ userId: requestId, actorId: userId, type: 'request', action: 'accept', target: userId });
  emitToUser(requestId, 'connections:companion', { userId, companion: true });
  emitToUser(userId, 'connections:companion', { userId: requestId, companion: true });

  return { success: true };
}

/** POST /api/requests/:id/decline — refuser (pas de resuggestion 30j). */
export async function declineRequest(userId: string, requestId: string): Promise<{ success: true }> {
  const [row] = await db
    .select()
    .from(schema.connections)
    .where(
      or(
        and(eq(schema.connections.fromUserId, requestId), eq(schema.connections.toUserId, userId), eq(schema.connections.status, 'request')),
        and(eq(schema.connections.fromUserId, userId), eq(schema.connections.toUserId, requestId), eq(schema.connections.status, 'interested')),
      ),
    )
    .limit(1);
  if (!row) throw AppError.notFound('Demande introuvable', 'REQUEST_NOT_FOUND');

  await db
    .delete(schema.connections)
    .where(and(eq(schema.connections.fromUserId, row.fromUserId), eq(schema.connections.toUserId, row.toUserId)));
  await redis.sadd(`declined:${userId}`, requestId);
  await redis.expire(`declined:${userId}`, DECLINED_TTL);

  return { success: true };
}

/** POST /api/requests/:id/block — bloquer l'émetteur de la demande. */
export async function blockRequester(userId: string, requestId: string): Promise<{ success: true }> {
  await db.insert(schema.blocks).values({ blockerId: userId, blockedId: requestId }).onConflictDoNothing();
  await redis.sadd(blockedKey(userId), requestId);
  await db
    .delete(schema.connections)
    .where(or(and(eq(schema.connections.fromUserId, requestId), eq(schema.connections.toUserId, userId)), and(eq(schema.connections.fromUserId, userId), eq(schema.connections.toUserId, requestId))));
  await redis.srem(companionsKey(userId), requestId);
  await redis.srem(companionsKey(requestId), userId);

  return { success: true };
}

/** DELETE /api/connections/:userId — supprimer un compagnon. */
export async function removeCompanion(userId: string, targetId: string): Promise<{ success: true }> {
  const deleted = await db
    .delete(schema.connections)
    .where(
      or(
        and(eq(schema.connections.fromUserId, userId), eq(schema.connections.toUserId, targetId)),
        and(eq(schema.connections.fromUserId, targetId), eq(schema.connections.toUserId, userId)),
      ),
    )
    .returning({ fromUserId: schema.connections.fromUserId });

  if (deleted.length === 0) throw AppError.notFound('Connexion introuvable', 'CONNECTION_NOT_FOUND');
  await redis.srem(companionsKey(userId), targetId);
  await redis.srem(companionsKey(targetId), userId);

  return { success: true };
}
