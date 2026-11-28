import { canSeeLocation, shouldHideLocation, type AudienceMode, type LocationVisibility } from './location.policy';

/**
 * Visibilité appliquée quand la ligne de réglages manque ou est invalide. Identique au défaut de la base
 * (`user_location_settings.visibility`, migration 0026) : en cas de doute, on ne montre qu'aux compagnons.
 */
export const DEFAULT_LOCATION_VISIBILITY: LocationVisibility = 'friends';

/** Rayon maximal de la carte « People Nearby ». */
export const NEARBY_RADIUS_KM = 50;

const VISIBILITIES: readonly string[] = ['nobody', 'friends', 'friends_of_friends', 'nearby', 'everyone'];
const AUDIENCES: readonly string[] = ['default', 'selected', 'except'];

export const isLocationVisibility = (v: unknown): v is LocationVisibility => typeof v === 'string' && VISIBILITIES.includes(v);
export const isAudienceMode = (v: unknown): v is AudienceMode => typeof v === 'string' && AUDIENCES.includes(v);

export type NearbyRejection = 'self' | 'blocked' | 'no_coordinates' | 'hidden' | 'not_allowed' | 'out_of_range';

export type NearbyDecision = { visible: true } | { visible: false; reason: NearbyRejection };

export interface NearbyCandidate {
  id: string;
  latitude: number | null;
  longitude: number | null;
  /** Réglages issus du LEFT JOIN : `null` quand la ligne n'existe pas encore (valeurs par défaut). */
  visibility: string | null;
  audienceMode: string | null;
  ghost: boolean | null;
  expiresAt: Date | null;
}

export interface NearbyRelations {
  friendIds: ReadonlySet<string>;
  friendOfFriendIds: ReadonlySet<string>;
  blockedIds: ReadonlySet<string>;
  /** Propriétaires dont la liste d'audience contient le demandeur. */
  listedByIds: ReadonlySet<string>;
}

/**
 * Décide, sans effet de bord, si `candidate` apparaît sur la carte de `viewerId`.
 * L'ordre des vérifications est celui historique de `getPeopleNearby` ; la première qui échoue
 * donne la raison du refus. `distanceKm` vaut `null` quand le candidat n'a pas de coordonnées.
 */
export function evaluateNearbyCandidate(
  viewerId: string,
  candidate: NearbyCandidate,
  relations: NearbyRelations,
  distanceKm: number | null,
  now = Date.now(),
): NearbyDecision {
  if (candidate.id === viewerId) return { visible: false, reason: 'self' };
  if (relations.blockedIds.has(candidate.id)) return { visible: false, reason: 'blocked' };
  if (candidate.latitude === null || candidate.longitude === null) return { visible: false, reason: 'no_coordinates' };
  if (shouldHideLocation({ sharingEnabled: true, ghostMode: candidate.ghost ?? false, expiresAt: candidate.expiresAt }, now)) {
    return { visible: false, reason: 'hidden' };
  }
  const visibility: LocationVisibility = isLocationVisibility(candidate.visibility) ? candidate.visibility : DEFAULT_LOCATION_VISIBILITY;
  const mode: AudienceMode = isAudienceMode(candidate.audienceMode) ? candidate.audienceMode : 'default';
  const allowed = canSeeLocation({
    visibility,
    mode,
    listed: relations.listedByIds.has(candidate.id),
    isFriend: relations.friendIds.has(candidate.id),
    isFriendOfFriend: relations.friendOfFriendIds.has(candidate.id),
  });
  if (!allowed) return { visible: false, reason: 'not_allowed' };
  if (distanceKm === null || distanceKm > NEARBY_RADIUS_KM) return { visible: false, reason: 'out_of_range' };
  return { visible: true };
}
