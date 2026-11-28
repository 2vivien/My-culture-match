import { eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { userLocationSettings } from './location.schema';
import { sharingOffPatch, sharingOnPatch, type Coordinates } from './location.sharing.patch';

/**
 * Point UNIQUE d'activation / désactivation du partage de position (PATCH /users/me/location et
 * PATCH /location/settings). Sans dépendance vers location.service / users.service, qui l'importent tous deux.
 */

export const locationSettingsCacheKey = (userId: string) => `location:settings:${userId}`;
const userCacheKey = (userId: string) => `user:${userId}`;

/**
 * Crée la ligne de réglages de position (valeurs par défaut de la base : visibilité « friends ») si elle manque.
 * Sans elle, activer le partage laissait la personne sans réglages explicites. Idempotent.
 */
export async function ensureLocationSettingsRow(userId: string): Promise<void> {
  await db.insert(userLocationSettings).values({ userId }).onConflictDoNothing({ target: userLocationSettings.userId });
}

/** Retire les caches qui reflètent l'état du partage (réglages de position et profil mis en cache). */
export async function invalidateLocationCaches(userId: string): Promise<void> {
  await redis.del(locationSettingsCacheKey(userId), userCacheKey(userId));
}

/**
 * Coupe le partage : purge les coordonnées, le lieu des stories de la personne (pas seulement leur affichage)
 * et invalide les caches. Toutes les voies de désactivation passent par ici.
 */
export async function disableLocationSharing(userId: string): Promise<void> {
  await db.update(schema.users).set(sharingOffPatch(new Date())).where(eq(schema.users.id, userId));
  await db.update(schema.stories).set({ placeLat: null, placeLon: null, placeLabel: null }).where(eq(schema.stories.userId, userId));
  await invalidateLocationCaches(userId);
}

/** Active le partage (réglages créés au besoin). Les coordonnées ne sont écrites que si elles sont fournies. */
export async function enableLocationSharing(userId: string, coords?: Partial<Coordinates>): Promise<void> {
  await ensureLocationSettingsRow(userId);
  await db.update(schema.users).set(sharingOnPatch(coords, new Date())).where(eq(schema.users.id, userId));
  await invalidateLocationCaches(userId);
}
