import { and, eq, gte, inArray, lte, or } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { emitToUser } from '../../infrastructure/websocket';
import { userLocationSettings, locationAudience, audienceModes, locationPrecision, locationVisibility, type AudienceMode, type LocationPrecision, type LocationVisibility } from './location.schema';
import { requiresConsent, computeReach, type Reach } from './location.policy';
import { AppError } from '../../shared/utils/AppError';
import { haversineKm } from '../users/users.service';
import { evaluateNearbyCandidate, NEARBY_RADIUS_KM } from './location.nearby.filter';
import { computeMatchScore } from '../users/match-score';
import { obfuscatePosition } from './location.privacy';
import { env } from '../../config/env';

const cacheKey = (id: string) => `location:settings:${id}`;
const LOCATION_EVENT = 'location:nearby:update';

export interface LocationSettingsDto {
  sharingEnabled: boolean;
  visibility: LocationVisibility;
  precision: LocationPrecision;
  ghostMode: boolean;
  audienceMode: AudienceMode;
  showDistance: boolean;
  showActiveStatus: boolean;
  /** Opt-in : être prévenu discrètement qu'une personne visible est près de soi. Désactivé par défaut. */
  nearbyNotify: boolean;
  expiresAt: string | null;
}

const validVisibility = (v: unknown): v is LocationVisibility => typeof v === 'string' && (locationVisibility as readonly string[]).includes(v);
const validAudience = (v: unknown): v is AudienceMode => typeof v === 'string' && (audienceModes as readonly string[]).includes(v);
const validPrecision = (v: unknown): v is LocationPrecision => typeof v === 'string' && (locationPrecision as readonly string[]).includes(v);

async function rowFor(userId: string) {
  const [row] = await db.select().from(userLocationSettings).where(eq(userLocationSettings.userId, userId)).limit(1);
  if (row) return row;
  const [created] = await db.insert(userLocationSettings).values({ userId }).returning();
  if (!created) throw AppError.badRequest('Réglages de localisation non initialisés', 'LOCATION_SETTINGS_INIT_FAILED');
  return created;
}

export async function getLocationSettings(userId: string): Promise<LocationSettingsDto> {
  const cached = await redis.get(cacheKey(userId));
  if (cached) return JSON.parse(cached) as LocationSettingsDto;
  const [user] = await db.select({ sharingEnabled: schema.users.locationSharingEnabled }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
  const row = await rowFor(userId);
  const dto: LocationSettingsDto = {
    sharingEnabled: user.sharingEnabled,
    visibility: validVisibility(row.visibility) ? row.visibility : 'nearby',
    precision: validPrecision(row.precision) ? row.precision : 'approximate',
    ghostMode: row.ghostMode,
    audienceMode: validAudience(row.audienceMode) ? row.audienceMode : 'default',
    showDistance: row.showDistance,
    showActiveStatus: row.showActiveStatus,
    nearbyNotify: row.nearbyNotify === true,
    expiresAt: row.expiresAt?.toISOString() ?? null,
  };
  await redis.set(cacheKey(userId), JSON.stringify(dto), 'EX', 300);
  return dto;
}

export async function updateLocationSettings(userId: string, input: Partial<Omit<LocationSettingsDto, 'nearbyNotify'>> & { consent?: boolean }): Promise<LocationSettingsDto> {
  const current = await rowFor(userId);
  if (input.sharingEnabled !== undefined) {
    const [me] = await db.select({ enabled: schema.users.locationSharingEnabled }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
    if (requiresConsent({ currentlyEnabled: Boolean(me?.enabled), wantsEnabled: input.sharingEnabled, consent: input.consent === true })) {
      throw AppError.badRequest('Active le partage de position explicitement (consent: true)', 'LOCATION_CONSENT_REQUIRED');
    }
  }
  const visibility = input.visibility ?? current.visibility;
  const precision = input.precision ?? current.precision;
  const audienceMode = input.audienceMode ?? (validAudience(current.audienceMode) ? current.audienceMode : 'default');
  if (!validAudience(audienceMode)) throw AppError.badRequest('Audience de localisation invalide', 'INVALID_LOCATION_AUDIENCE');
  if (!validVisibility(visibility)) throw AppError.badRequest('Visibilité de localisation invalide', 'INVALID_LOCATION_VISIBILITY');
  if (!validPrecision(precision)) throw AppError.badRequest('Précision de localisation invalide', 'INVALID_LOCATION_PRECISION');
  const expiresAt = input.expiresAt === null ? null : input.expiresAt ? new Date(input.expiresAt) : current.expiresAt;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) throw AppError.badRequest('Expiration invalide', 'INVALID_LOCATION_EXPIRY');

  await db.insert(userLocationSettings).values({
    userId, visibility, precision, audienceMode,
    ghostMode: input.ghostMode ?? current.ghostMode,
    showDistance: input.showDistance ?? current.showDistance,
    showActiveStatus: input.showActiveStatus ?? current.showActiveStatus,
    expiresAt, updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: userLocationSettings.userId,
    set: {
      visibility, precision, audienceMode,
      ghostMode: input.ghostMode ?? current.ghostMode,
      showDistance: input.showDistance ?? current.showDistance,
      showActiveStatus: input.showActiveStatus ?? current.showActiveStatus,
      expiresAt, updatedAt: new Date(),
    },
  });

  if (input.sharingEnabled === false) {
    // Retrait total : couper le partage efface le lieu des stories de la personne (pas seulement leur affichage).
    await db.update(schema.stories).set({ placeLat: null, placeLon: null, placeLabel: null }).where(eq(schema.stories.userId, userId));
  }
  if (input.sharingEnabled !== undefined) {
    await db.update(schema.users).set({
      locationSharingEnabled: input.sharingEnabled,
      latitude: input.sharingEnabled ? undefined : null,
      longitude: input.sharingEnabled ? undefined : null,
      locationUpdatedAt: input.sharingEnabled ? new Date() : null,
      updatedAt: new Date(),
    }).where(eq(schema.users.id, userId));
  }
  await redis.del(cacheKey(userId));
  const settings = await getLocationSettings(userId);
  await notifyLocationChange(userId, settings);
  return settings;
}

/** Active / désactive la notification « près de toi » (opt-in explicite, désactivée par défaut). */
export async function setNearbyNotify(userId: string, enabled: boolean): Promise<{ nearbyNotify: boolean }> {
  await rowFor(userId);
  await db.update(userLocationSettings).set({ nearbyNotify: enabled, updatedAt: new Date() }).where(eq(userLocationSettings.userId, userId));
  await redis.del(cacheKey(userId));
  return { nearbyNotify: enabled };
}

export async function getNearbyNotify(userId: string): Promise<{ nearbyNotify: boolean }> {
  return { nearbyNotify: (await getLocationSettings(userId)).nearbyNotify === true };
}

export function boundingBox(latitude: number, longitude: number, radiusKm: number) {
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.2));
  return { minLat: latitude - latDelta, maxLat: latitude + latDelta, minLon: longitude - lonDelta, maxLon: longitude + lonDelta };
}

export async function companionIds(userId: string): Promise<Set<string>> {
  const rows = await db.select({ fromUserId: schema.connections.fromUserId, toUserId: schema.connections.toUserId })
    .from(schema.connections)
    .where(and(or(eq(schema.connections.fromUserId, userId), eq(schema.connections.toUserId, userId)), eq(schema.connections.status, 'companion')));
  return new Set(rows.map(r => r.fromUserId === userId ? r.toUserId : r.fromUserId));
}

export async function friendsOfFriendsIds(friendIds: Set<string>, userId: string): Promise<Set<string>> {
  if (friendIds.size === 0) return new Set();
  const ids = [...friendIds];
  const rows = await db.select({ fromUserId: schema.connections.fromUserId, toUserId: schema.connections.toUserId })
    .from(schema.connections)
    .where(and(eq(schema.connections.status, 'companion'), or(inArray(schema.connections.fromUserId, ids), inArray(schema.connections.toUserId, ids))));
  const result = new Set<string>();
  for (const r of rows) {
    const other = friendIds.has(r.fromUserId) ? r.toUserId : r.fromUserId;
    if (other !== userId && !friendIds.has(other)) result.add(other);
  }
  return result;
}

export async function blockedBetween(userId: string): Promise<Set<string>> {
  const rows = await db.select({ blockerId: schema.blocks.blockerId, blockedId: schema.blocks.blockedId })
    .from(schema.blocks)
    .where(or(eq(schema.blocks.blockerId, userId), eq(schema.blocks.blockedId, userId)));
  return new Set(rows.map(r => r.blockerId === userId ? r.blockedId : r.blockerId));
}

export async function getPeopleNearby(userId: string, viewerLocation?: { latitude: number; longitude: number }) {
  const [viewer] = await db.select({ latitude: schema.users.latitude, longitude: schema.users.longitude, sharingEnabled: schema.users.locationSharingEnabled, values: schema.users.values, languages: schema.users.languages, country: schema.users.country })
    .from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!viewer) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
  const origin = viewer.sharingEnabled && viewer.latitude !== null && viewer.longitude !== null ? { latitude: viewer.latitude, longitude: viewer.longitude } : viewerLocation;
  if (!origin) return { people: [], total: 0 };

  const [friends, blocked] = await Promise.all([companionIds(userId), blockedBetween(userId)]);
  const fof = await friendsOfFriendsIds(friends, userId);
  const { minLat, maxLat, minLon, maxLon } = boundingBox(origin.latitude, origin.longitude, NEARBY_RADIUS_KM);
  const candidates = await db.select({
    id: schema.users.id, name: schema.users.name, username: schema.users.username, avatar: schema.users.avatar,
    bio: schema.users.bio, country: schema.users.country, location: schema.users.location, languages: schema.users.languages,
    values: schema.users.values, intention: schema.users.intention, latitude: schema.users.latitude, longitude: schema.users.longitude,
    updated: schema.users.locationUpdatedAt, visibility: userLocationSettings.visibility, precision: userLocationSettings.precision,
    ghost: userLocationSettings.ghostMode, showDistance: userLocationSettings.showDistance, showActive: userLocationSettings.showActiveStatus,
    expiresAt: userLocationSettings.expiresAt, audienceMode: userLocationSettings.audienceMode,
  }).from(schema.users).leftJoin(userLocationSettings, eq(userLocationSettings.userId, schema.users.id)).where(and(
    eq(schema.users.profileCompleted, true), eq(schema.users.locationSharingEnabled, true),
    gte(schema.users.latitude, minLat), lte(schema.users.latitude, maxLat), gte(schema.users.longitude, minLon), lte(schema.users.longitude, maxLon),
  )).limit(1000);

  // Propriétaires dont la liste d'audience contient le demandeur (une seule requête pour tous les candidats).
  const listedRows = candidates.length > 0
    ? await db.select({ ownerId: locationAudience.ownerId }).from(locationAudience).where(and(eq(locationAudience.memberId, userId), inArray(locationAudience.ownerId, candidates.map((c) => c.id))))
    : [];
  const listedBy = new Set(listedRows.map((r) => r.ownerId));

  const people: Array<Record<string, unknown>> = [];
  for (const c of candidates) {
    const distance = c.latitude !== null && c.longitude !== null ? haversineKm(origin.latitude, origin.longitude, c.latitude, c.longitude) : null;
    const decision = evaluateNearbyCandidate(userId, c, { friendIds: friends, friendOfFriendIds: fof, blockedIds: blocked, listedByIds: listedBy }, distance);
    if (!decision.visible || distance === null || c.latitude === null || c.longitude === null) continue;
    const precision = validPrecision(c.precision) ? c.precision : 'approximate';
    const distanceKm = c.showDistance ? (distance < 1 ? Number(distance.toFixed(1)) : Math.round(distance)) : null;
    const position = obfuscatePosition(c.latitude, c.longitude, c.id, precision, env.BETTER_AUTH_SECRET);
    people.push({
      id: c.id, name: c.name, username: c.username, avatar: c.avatar, bio: c.bio, country: c.country, location: c.location,
      languages: c.languages, values: c.values, intention: c.intention, matchScore: computeMatchScore(viewer, c), ...position, distanceKm,
      distanceLabel: distanceKm === null ? null : distanceKm < 1 ? 'Nearby' : `~${distanceKm} km away`,
      isCompanion: friends.has(c.id), isFriendOfFriend: fof.has(c.id),
      isActive: c.showActive ? !!c.updated && Date.now() - c.updated.getTime() < 120000 : false,
    });
  }
  people.sort((a, b) => Number(a.distanceKm ?? 999) - Number(b.distanceKm ?? 999));
  return { people: people.slice(0, 200), total: people.length };
}

async function notifyLocationChange(userId: string, settings: LocationSettingsDto) {
  if (!settings.sharingEnabled || settings.ghostMode) return;
  const friends = await companionIds(userId);
  for (const recipientId of friends) emitToUser(recipientId, LOCATION_EVENT, { userId, action: 'refresh' });
  const [user] = await db.select({ latitude: schema.users.latitude, longitude: schema.users.longitude }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (user?.latitude === null || user?.latitude === undefined || user.longitude === null || user.longitude === undefined) return;
  const { minLat, maxLat, minLon, maxLon } = boundingBox(user.latitude, user.longitude, NEARBY_RADIUS_KM);
  const nearby = await db.select({ id: schema.users.id }).from(schema.users).leftJoin(userLocationSettings, eq(userLocationSettings.userId, schema.users.id)).where(and(
    eq(schema.users.profileCompleted, true), eq(schema.users.locationSharingEnabled, true),
    gte(schema.users.latitude, minLat), lte(schema.users.latitude, maxLat), gte(schema.users.longitude, minLon), lte(schema.users.longitude, maxLon),
  )).limit(300);
  for (const recipient of nearby) if (recipient.id !== userId && !friends.has(recipient.id)) emitToUser(recipient.id, LOCATION_EVENT, { userId, action: 'refresh' });
}

/** Liste d'audience : lecture (profils minimaux des compagnons choisis). */
export async function getAudience(userId: string): Promise<{ members: Array<{ id: string; name: string; username: string; avatar: string | null }> }> {
  const rows = await db.select({ id: schema.users.id, name: schema.users.name, username: schema.users.username, avatar: schema.users.avatar })
    .from(locationAudience).innerJoin(schema.users, eq(schema.users.id, locationAudience.memberId))
    .where(eq(locationAudience.ownerId, userId));
  return { members: rows };
}

/** Liste d'audience : remplacement. Seuls des compagnons (connexions acceptées) peuvent y figurer. */
export async function setAudience(userId: string, memberIds: string[]): Promise<{ members: number }> {
  const unique = [...new Set(memberIds)].filter((id) => id !== userId);
  if (unique.length > 200) throw AppError.badRequest('Audience limitée à 200 personnes', 'AUDIENCE_TOO_LARGE');
  const friends = await companionIds(userId);
  const stranger = unique.find((id) => !friends.has(id));
  if (stranger) throw AppError.badRequest('Seuls tes compagnons peuvent figurer dans ton audience', 'AUDIENCE_NOT_COMPANION');
  await db.transaction(async (tx) => {
    await tx.delete(locationAudience).where(eq(locationAudience.ownerId, userId));
    if (unique.length > 0) await tx.insert(locationAudience).values(unique.map((memberId) => ({ ownerId: userId, memberId })));
  });
  await redis.del(cacheKey(userId));
  return { members: unique.length };
}

/** GET /location/reach — « Ta position est partagée avec N personnes ». */
export async function getReach(userId: string): Promise<Reach> {
  const settings = await getLocationSettings(userId);
  if (!settings.sharingEnabled) return computeReach({ sharingEnabled: false, ghostMode: settings.ghostMode, expiresAt: null, visibility: settings.visibility, mode: settings.audienceMode, friendIds: new Set(), friendOfFriendIds: new Set(), listedIds: new Set() });
  const [friends, blocked] = await Promise.all([companionIds(userId), blockedBetween(userId)]);
  for (const id of blocked) friends.delete(id);
  const fof = await friendsOfFriendsIds(friends, userId);
  for (const id of blocked) fof.delete(id);
  const listedRows = await db.select({ memberId: locationAudience.memberId }).from(locationAudience).where(eq(locationAudience.ownerId, userId));
  return computeReach({
    sharingEnabled: true,
    ghostMode: settings.ghostMode,
    expiresAt: settings.expiresAt ? new Date(settings.expiresAt) : null,
    visibility: settings.visibility,
    mode: settings.audienceMode,
    friendIds: friends,
    friendOfFriendIds: fof,
    listedIds: new Set(listedRows.map((r) => r.memberId)),
  });
}
