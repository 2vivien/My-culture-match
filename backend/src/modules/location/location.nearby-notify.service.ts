import { and, eq, gte, isNull, lte, or } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { logger } from '../../middleware/logger';
import { haversineKm } from '../users/users.service';
import { createNotification } from '../notifications/notifications.service';
import { userLocationSettings, locationAudience } from './location.schema';
import { blockedBetween, companionIds, friendsOfFriendsIds, getLocationSettings } from './location.service';
import {
  decideNearbyNotification,
  nearbyDailyKey,
  nearbyPairKey,
  nearbyScanKey,
  reserveNearbyNotification,
  NEARBY_NOTIFY_RADIUS_KM,
  NEARBY_SCAN_THROTTLE_SECONDS,
} from './location.nearby-notify';

/** Marge du rectangle englobant : on filtre ensuite par distance réelle. */
function box(lat: number, lon: number, radiusKm: number) {
  const dLat = radiusKm / 111;
  const dLon = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLon: lon - dLon, maxLon: lon + dLon };
}

/**
 * Prévient discrètement les personnes proches qui l'ont demandé (opt-in) que `emitterId` est près d'elles.
 * Appelée en « fire and forget » depuis le heartbeat : elle ne doit jamais retarder ni faire échouer la réponse.
 *
 * Rien n'est transmis de la position : la notification est de type `system`, action `nearby_person`,
 * sans métadonnées ni distance.
 */
export async function notifyNearbyPeople(emitterId: string, latitude: number, longitude: number): Promise<number> {
  // Un balayage au plus toutes les 5 minutes par émetteur : le heartbeat est fréquent.
  const claimed = await redis.set(nearbyScanKey(emitterId), '1', 'EX', NEARBY_SCAN_THROTTLE_SECONDS, 'NX');
  if (claimed !== 'OK') return 0;

  const emitter = await getLocationSettings(emitterId);
  // Sortie rapide avant toute requête de voisinage : fantôme, partage coupé, expiré ou « personne ».
  if (!emitter.sharingEnabled || emitter.ghostMode || emitter.visibility === 'nobody') return 0;
  if (emitter.expiresAt && new Date(emitter.expiresAt).getTime() <= Date.now()) return 0;

  const { minLat, maxLat, minLon, maxLon } = box(latitude, longitude, NEARBY_NOTIFY_RADIUS_KM);
  const candidates = await db.select({
    id: schema.users.id, latitude: schema.users.latitude, longitude: schema.users.longitude,
    sharingEnabled: schema.users.locationSharingEnabled, locationUpdatedAt: schema.users.locationUpdatedAt,
  }).from(schema.users).innerJoin(userLocationSettings, eq(userLocationSettings.userId, schema.users.id))
    .leftJoin(schema.userSettings, eq(schema.userSettings.userId, schema.users.id)).where(and(
    eq(userLocationSettings.nearbyNotify, true),
    // Le réglage global « notifications » reste prioritaire (ligne absente = activé par défaut).
    or(isNull(schema.userSettings.userId), eq(schema.userSettings.notificationsEnabled, true)), eq(schema.users.locationSharingEnabled, true), eq(schema.users.profileCompleted, true),
    gte(schema.users.latitude, minLat), lte(schema.users.latitude, maxLat),
    gte(schema.users.longitude, minLon), lte(schema.users.longitude, maxLon),
  )).limit(200);
  const others = candidates.filter((c) => c.id !== emitterId && c.latitude !== null && c.longitude !== null);
  if (others.length === 0) return 0;

  // Relations vues depuis l'émetteur : exactement les entrées de canSeeLocation.
  const [friends, blocked] = await Promise.all([companionIds(emitterId), blockedBetween(emitterId)]);
  const fof = await friendsOfFriendsIds(friends, emitterId);
  const listedRows = await db.select({ memberId: locationAudience.memberId }).from(locationAudience).where(eq(locationAudience.ownerId, emitterId));
  const listed = new Set(listedRows.map((r) => r.memberId));

  let sent = 0;
  for (const r of others) {
    const [pair, daily] = await Promise.all([redis.exists(nearbyPairKey(emitterId, r.id)), redis.get(nearbyDailyKey(r.id))]);
    const decision = decideNearbyNotification({
      emitterId,
      recipientId: r.id,
      emitter: { sharingEnabled: emitter.sharingEnabled, ghostMode: emitter.ghostMode, expiresAt: emitter.expiresAt ? new Date(emitter.expiresAt) : null, visibility: emitter.visibility, mode: emitter.audienceMode },
      relation: { blocked: blocked.has(r.id), isFriend: friends.has(r.id), isFriendOfFriend: fof.has(r.id), listed: listed.has(r.id) },
      recipient: { optIn: true, sharingEnabled: r.sharingEnabled, locationUpdatedAt: r.locationUpdatedAt },
      distanceKm: haversineKm(latitude, longitude, r.latitude as number, r.longitude as number),
      pairAlreadyNotified: pair === 1,
      recipientDailyCount: Number(daily ?? 0),
    });
    if (!decision.notify) continue;
    // Réservation atomique des plafonds, puis envoi.
    const reservation = await reserveNearbyNotification(redis, emitterId, r.id);
    if (!reservation.ok) continue;
    try {
      await createNotification({ userId: r.id, actorId: emitterId, type: 'system', action: 'nearby_person', target: null, metadata: null });
      sent += 1;
    } catch (error) {
      logger.warn({ err: error, emitterId }, 'nearby notification failed');
    }
  }
  return sent;
}

/** Déclenche le balayage sans jamais bloquer ni faire échouer l'appelant. */
export function scheduleNearbyNotifications(emitterId: string, latitude: number, longitude: number): void {
  void notifyNearbyPeople(emitterId, latitude, longitude).catch((error) => {
    logger.warn({ err: error, emitterId }, 'nearby notification scan failed');
  });
}
