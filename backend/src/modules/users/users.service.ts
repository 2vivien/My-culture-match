import { and, desc, eq, or, sql } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { requiresConsent } from '../location/location.policy';
import { disableLocationSharing, enableLocationSharing } from '../location/location.sharing';
import type { ProfilePatchInput } from './users.schemas';
import { addFollower, removeFollower, followingKey } from '../feed/fanout';

const USER_CACHE_TTL = 60 * 60; // 1h
const userCacheKey = (id: string) => `user:${id}`;

/**
 * Profil public d'un utilisateur (jamais l'email). Forme alignée sur le
 * `CurrentUser` du frontend (`myculturematch-web`).
 */
export interface PublicUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  banner: string | null;
  avatarSeed: string | null;
  locale: string;
  level: number;
  glow: string;
  xp: number;
  location: string | null;
  country: string | null;
  region: string | null;
  gender: string | null;
  seeking: string | null;
  age: number | null;
  roots: Record<string, unknown> | null;
  languages: string[] | null;
  intention: string | null;
  occupation: Record<string, unknown> | null;
  values: string[] | null;
  preference: string | null;
  diaspora: string | null;
  familyQuiz: string | null;
  situation: string | null;
  criteria: string[] | null;
  bio: string | null;
  traditionsCount: number;
  culturesCount: number;
  tribesCount: number;
  interestedCount: number;
  companionsCount: number;
  tribes: string[];
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  profileCompleted: boolean;
  createdAt: string;
}

function serializePublic(row: schema.User, tribeNames: string[], extra?: Partial<PublicUser>): PublicUser {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    avatar: row.avatar,
    banner: row.banner,
    avatarSeed: row.avatarSeed,
    locale: row.locale,
    level: row.level,
    glow: row.glow,
    xp: row.xp,
    location: row.location,
    country: row.country,
    region: row.region,
    gender: row.gender,
    seeking: row.seeking,
    age: row.age,
    roots: (row.roots as Record<string, unknown>) ?? null,
    languages: row.languages ?? null,
    intention: row.intention,
    occupation: (row.occupation as Record<string, unknown>) ?? null,
    values: row.values ?? null,
    preference: row.preference,
    diaspora: row.diaspora,
    familyQuiz: row.familyQuiz,
    situation: row.situation,
    criteria: row.criteria ?? null,
    bio: row.bio,
    traditionsCount: row.traditionsCount,
    culturesCount: row.culturesCount,
    tribesCount: row.tribesCount,
    interestedCount: row.interestedCount,
    companionsCount: row.companionsCount,
    tribes: tribeNames,
    profileCompleted: row.profileCompleted,
    createdAt: row.createdAt.toISOString(),
    ...extra,
  };
}

/** Récupère la liste des noms de tribus d'un utilisateur (membres). */
async function fetchUserTribes(userId: string): Promise<string[]> {
  const rows = await db
    .select({ name: schema.tribes.name })
    .from(schema.tribeMembers)
    .innerJoin(schema.tribes, eq(schema.tribes.id, schema.tribeMembers.tribeId))
    .where(eq(schema.tribeMembers.userId, userId));
  return rows.map((r) => r.name);
}

async function findUser(userId: string): Promise<schema.User> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
  return user;
}

async function cachedPublicUser(userId: string): Promise<PublicUser> {
  const cached = await redis.get(userCacheKey(userId));
  if (cached) {
    return JSON.parse(cached) as PublicUser;
  }

  const user = await findUser(userId);
  const tribes = await fetchUserTribes(userId);
  const [followersCount, followingCount] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.follows)
      .where(eq(schema.follows.followingId, userId))
      .then((r) => r[0]?.count ?? 0),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.follows)
      .where(eq(schema.follows.followerId, userId))
      .then((r) => r[0]?.count ?? 0),
  ]);
  const profile = serializePublic(user, tribes, { followersCount, followingCount });
  await redis.set(userCacheKey(userId), JSON.stringify(profile), 'EX', USER_CACHE_TTL);
  return profile;
}

/** GET /api/users/me — profil courant complet (sans cache pour fraîcheur). */
export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await findUser(userId);
  const tribes = await fetchUserTribes(userId);
  return serializePublic(user, tribes);
}

/**
 * PATCH /api/users/me/location — partage de position (style Snap Map).
 * Active/désactive le partage et enregistre les dernières coordonnées.
 */
export async function updateLocation(
  userId: string,
  input: { latitude?: number; longitude?: number; enabled?: boolean; consent?: boolean },
): Promise<{ success: true; latitude: number | null; longitude: number | null; locationSharingEnabled: boolean }> {
  const enabled = input.enabled ?? true;

  if (enabled) {
    // Envoyer des coordonnées n'équivaut pas à consentir : l'activation initiale doit être explicite.
    const [me] = await db.select({ on: schema.users.locationSharingEnabled }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (requiresConsent({ currentlyEnabled: Boolean(me?.on), wantsEnabled: true, consent: input.consent === true })) {
      throw AppError.badRequest('Active le partage de position explicitement (consent: true)', 'LOCATION_CONSENT_REQUIRED');
    }
  }

  if (!enabled) {
    await disableLocationSharing(userId);
    return { success: true, latitude: null, longitude: null, locationSharingEnabled: false };
  }

  await enableLocationSharing(userId, { latitude: input.latitude, longitude: input.longitude });
  const hasCoords = Number.isFinite(input.latitude) && Number.isFinite(input.longitude);
  return { success: true, latitude: hasCoords ? (input.latitude as number) : null, longitude: hasCoords ? (input.longitude as number) : null, locationSharingEnabled: true };
}

/** Distance Haversine en km entre deux points. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** GET /api/users/:id — profil public (mis en cache 1h, hors champs liés au viewer). */
export async function getPublicUser(userId: string, viewerId?: string): Promise<PublicUser> {
  const profile = await cachedPublicUser(userId);
  if (!viewerId || viewerId === userId) return profile;

  const [followRow] = await db
    .select({ followerId: schema.follows.followerId })
    .from(schema.follows)
    .where(and(eq(schema.follows.followerId, viewerId), eq(schema.follows.followingId, userId)))
    .limit(1);
  return { ...profile, isFollowing: Boolean(followRow) };
}

/** PATCH /api/users/me — met à jour les champs ProfileDetails fournis. */
export async function updateProfile(userId: string, patch: ProfilePatchInput): Promise<PublicUser> {
  const [updated] = await db
    .update(schema.users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(schema.users.id, userId))
    .returning();

  if (!updated) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');

  await redis.del(userCacheKey(userId));

  const tribes = await fetchUserTribes(userId);
  return serializePublic(updated, tribes);
}

// ── Follow / Unfollow ──────────────────────────────────────

/** Vérifie qu'une relation de follow n'est pas bloquée (ni dans un sens, ni dans l'autre). */
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

/** Rafraîchit le feed suivant avec les derniers posts publiés de l'auteur. */
async function backfillFollowingFeed(followerId: string, authorId: string): Promise<void> {
  const rows = await db
    .select({ id: schema.posts.id, createdAt: schema.posts.createdAt })
    .from(schema.posts)
    .where(and(eq(schema.posts.authorId, authorId), eq(schema.posts.status, 'published')))
    .orderBy(desc(schema.posts.createdAt))
    .limit(100);

  if (rows.length === 0) return;
  const pipe = redis.multi();
  for (const post of rows) {
    pipe.zadd(followingKey(followerId), post.createdAt.getTime(), post.id);
  }
  await pipe.exec();
}

/** POST /api/users/:id/follow — suit un utilisateur et backfill son feed. */
export async function followUser(followerId: string, targetId: string): Promise<{ following: boolean }> {
  if (followerId === targetId) throw AppError.badRequest('Impossible de se suivre soi-même', 'SELF_FOLLOW');

  const [target] = await db
    .select({ id: schema.users.id, profileCompleted: schema.users.profileCompleted })
    .from(schema.users)
    .where(eq(schema.users.id, targetId))
    .limit(1);
  if (!target) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');

  if (await isBlockedBetween(followerId, targetId)) {
    throw AppError.forbidden('Action impossible avec ce compte', 'BLOCKED');
  }

  await db
    .insert(schema.follows)
    .values({ followerId, followingId: targetId })
    .onConflictDoNothing();

  await addFollower(targetId, followerId);
  await backfillFollowingFeed(followerId, targetId);
  return { following: true };
}

/** DELETE /api/users/:id/follow — cesse de suivre. */
export async function unfollowUser(followerId: string, targetId: string): Promise<{ following: boolean }> {
  await db
    .delete(schema.follows)
    .where(and(eq(schema.follows.followerId, followerId), eq(schema.follows.followingId, targetId)));

  await removeFollower(targetId, followerId);

  // Retire les posts de l'auteur du feed suivant du follower
  const rows = await db
    .select({ id: schema.posts.id })
    .from(schema.posts)
    .where(eq(schema.posts.authorId, targetId))
    .limit(200);
  if (rows.length > 0) {
    await redis.zrem(followingKey(followerId), ...rows.map((r) => r.id));
  }

  return { following: false };
}

/** Récupère les IDs des utilisateurs suivis (pour tri de feed éventuel). */
export async function getFollowingIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ followingId: schema.follows.followingId })
    .from(schema.follows)
    .where(eq(schema.follows.followerId, userId));
  return rows.map((r) => r.followingId);
}
