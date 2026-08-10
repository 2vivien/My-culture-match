import { eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import type { ProfilePatchInput } from './users.schemas';

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
  profileCompleted: boolean;
  createdAt: string;
}

function serializePublic(row: schema.User, tribeNames: string[]): PublicUser {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    avatar: row.avatar,
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
  const profile = serializePublic(user, tribes);
  await redis.set(userCacheKey(userId), JSON.stringify(profile), 'EX', USER_CACHE_TTL);
  return profile;
}

/** GET /api/users/me — profil courant complet (sans cache pour fraîcheur). */
export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await findUser(userId);
  const tribes = await fetchUserTribes(userId);
  return serializePublic(user, tribes);
}

/** GET /api/users/:id — profil public (mis en cache 1h). */
export async function getPublicUser(userId: string): Promise<PublicUser> {
  return cachedPublicUser(userId);
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
