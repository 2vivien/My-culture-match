import { and, eq, gt, gte, isNotNull, lte, inArray } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { userLocationSettings, locationAudience } from '../location/location.schema';
import { NEARBY_RADIUS_KM } from '../location/location.nearby.filter';
import { boundingBox, blockedBetween, companionIds, friendsOfFriendsIds } from '../location/location.service';
import { haversineKm } from '../users/users.service';
import { evaluateStoryMarker } from './stories.place';

const MAX_MARKERS = 100;

export interface StoryMarkerDto {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  img: string;
  type: 'image' | 'video';
  caption: string | null;
  /** Lieu flouté (centre de cellule) : jamais la position exacte de l'auteur. */
  latitude: number;
  longitude: number;
  placeLabel: string | null;
  createdAt: string;
  expiresAt: string;
  viewed: boolean;
}

/**
 * GET /api/location/stories — stories actives posées sur la carte et visibles par ce lecteur.
 * Chaque story est soumise à la décision de visibilité de l'auteur (evaluateStoryMarker) : blocages,
 * visibilité, audience, mode fantôme, expiration du partage. Origine : lat/lon fournis, sinon la position
 * partagée du lecteur ; sans origine, aucun marqueur.
 */
export async function getMapStories(viewerId: string, origin?: { latitude: number; longitude: number }): Promise<{ stories: StoryMarkerDto[] }> {
  const [viewer] = await db.select({ latitude: schema.users.latitude, longitude: schema.users.longitude, sharing: schema.users.locationSharingEnabled })
    .from(schema.users).where(eq(schema.users.id, viewerId)).limit(1);
  if (!viewer) throw AppError.notFound('Utilisateur introuvable', 'USER_NOT_FOUND');
  const from = origin ?? (viewer.sharing && viewer.latitude !== null && viewer.longitude !== null ? { latitude: viewer.latitude, longitude: viewer.longitude } : undefined);
  if (!from) return { stories: [] };

  const { minLat, maxLat, minLon, maxLon } = boundingBox(from.latitude, from.longitude, NEARBY_RADIUS_KM);
  const rows = await db
    .select({
      story: schema.stories,
      name: schema.users.name,
      avatar: schema.users.avatar,
      sharing: schema.users.locationSharingEnabled,
      visibility: userLocationSettings.visibility,
      audienceMode: userLocationSettings.audienceMode,
      ghost: userLocationSettings.ghostMode,
      locationExpiresAt: userLocationSettings.expiresAt,
    })
    .from(schema.stories)
    .innerJoin(schema.users, eq(schema.users.id, schema.stories.userId))
    .leftJoin(userLocationSettings, eq(userLocationSettings.userId, schema.stories.userId))
    .where(and(
      gt(schema.stories.expiresAt, new Date()),
      isNotNull(schema.stories.placeLat),
      isNotNull(schema.stories.placeLon),
      eq(schema.users.locationSharingEnabled, true),
      gte(schema.stories.placeLat, minLat), lte(schema.stories.placeLat, maxLat),
      gte(schema.stories.placeLon, minLon), lte(schema.stories.placeLon, maxLon),
    ))
    .limit(500);
  if (rows.length === 0) return { stories: [] };

  const [friends, blocked] = await Promise.all([companionIds(viewerId), blockedBetween(viewerId)]);
  const fof = await friendsOfFriendsIds(friends, viewerId);
  const authorIds = [...new Set(rows.map((r) => r.story.userId))];
  const listed = await db.select({ ownerId: locationAudience.ownerId }).from(locationAudience)
    .where(and(eq(locationAudience.memberId, viewerId), inArray(locationAudience.ownerId, authorIds)));
  const relations = { friendIds: friends, friendOfFriendIds: fof, blockedIds: blocked, listedByIds: new Set(listed.map((l) => l.ownerId)) };

  const visible = rows.filter((r) => {
    const { story } = r;
    const distanceKm = story.placeLat !== null && story.placeLon !== null ? haversineKm(from.latitude, from.longitude, story.placeLat, story.placeLon) : null;
    return evaluateStoryMarker({
      viewerId,
      story: { authorId: story.userId, placeLat: story.placeLat, placeLon: story.placeLon, expiresAt: story.expiresAt },
      author: { sharingEnabled: r.sharing, visibility: r.visibility, audienceMode: r.audienceMode, ghost: r.ghost, locationExpiresAt: r.locationExpiresAt },
      relations,
      distanceKm,
    }).visible;
  }).slice(0, MAX_MARKERS);

  const markers: StoryMarkerDto[] = [];
  for (const r of visible) {
    const viewed = (await redis.sismember(`stories:viewed:${r.story.id}`, viewerId)) === 1;
    markers.push({
      id: r.story.id, userId: r.story.userId, name: r.name, avatar: r.avatar, img: r.story.url, type: r.story.type, caption: r.story.caption,
      latitude: r.story.placeLat as number, longitude: r.story.placeLon as number, placeLabel: r.story.placeLabel,
      createdAt: r.story.createdAt.toISOString(), expiresAt: r.story.expiresAt.toISOString(), viewed,
    });
  }
  return { stories: markers };
}
