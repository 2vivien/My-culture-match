import { evaluateNearbyCandidate, type NearbyRelations, type NearbyRejection } from '../location/location.nearby.filter';

/** Taille de cellule (degrés) selon la précision choisie : ~1,1 km (approximate) ou ~5,5 km (area). */
export const PLACE_CELL_DEGREES = { approximate: 0.01, area: 0.05 } as const;
export type PlacePrecision = keyof typeof PLACE_CELL_DEGREES;

export const PLACE_LABEL_MAX = 80;

export interface PlacePoint {
  latitude: number;
  longitude: number;
}

/**
 * Ramène un point au CENTRE de sa cellule de grille. Le point exact n'est jamais conservé : plusieurs points
 * d'une même cellule donnent la même position, ce qui empêche de les recouper pour retrouver l'endroit réel
 * (contrairement à un bruit aléatoire que l'on peut moyenner).
 */
export function snapToGrid(point: PlacePoint, precision: PlacePrecision = 'approximate'): PlacePoint {
  const cell = PLACE_CELL_DEGREES[precision];
  const snap = (value: number) => Math.floor(value / cell) * cell + cell / 2;
  const round = (n: number) => Number(n.toFixed(6));
  return { latitude: round(clampLat(snap(point.latitude))), longitude: round(clampLon(snap(point.longitude))) };
}

const clampLat = (v: number) => Math.max(-90, Math.min(90, v));
const clampLon = (v: number) => Math.max(-180, Math.min(180, v));

/** Libellé de lieu : espaces normalisés, tronqué, jamais vide (renvoie null). */
export function cleanPlaceLabel(label: string | null | undefined): string | null {
  const cleaned = (label ?? '').replace(/\s+/g, ' ').trim().slice(0, PLACE_LABEL_MAX);
  return cleaned.length > 0 ? cleaned : null;
}

export type StoryMarkerRejection = NearbyRejection | 'expired' | 'sharing_off' | 'nobody';

export type StoryMarkerDecision = { visible: true } | { visible: false; reason: StoryMarkerRejection };

export interface StoryMarkerInput {
  viewerId: string;
  story: { authorId: string; placeLat: number | null; placeLon: number | null; expiresAt: Date };
  author: {
    sharingEnabled: boolean;
    visibility: string | null;
    audienceMode: string | null;
    ghost: boolean | null;
    locationExpiresAt: Date | null;
  };
  relations: NearbyRelations;
  /** Distance entre l'origine du lecteur et le LIEU de la story (pas la position de l'auteur). */
  distanceKm: number | null;
}

/**
 * Un marqueur de story est visible exactement quand l'auteur le serait sur la carte (visibilité, audience,
 * blocages, mode fantôme, expiration du partage), en plus de : story non expirée, partage de position actif
 * chez l'auteur, et lieu renseigné. Le marqueur ne contourne donc jamais le mode fantôme.
 */
export function evaluateStoryMarker(input: StoryMarkerInput, now = Date.now()): StoryMarkerDecision {
  const { story, author } = input;
  if (story.expiresAt.getTime() <= now) return { visible: false, reason: 'expired' };
  if (!author.sharingEnabled) return { visible: false, reason: 'sharing_off' };
  if (author.visibility === 'nobody') return { visible: false, reason: 'nobody' };
  return evaluateNearbyCandidate(
    input.viewerId,
    {
      id: story.authorId,
      latitude: story.placeLat,
      longitude: story.placeLon,
      visibility: author.visibility,
      audienceMode: author.audienceMode,
      ghost: author.ghost,
      expiresAt: author.locationExpiresAt,
    },
    input.relations,
    input.distanceKm,
    now,
  );
}
