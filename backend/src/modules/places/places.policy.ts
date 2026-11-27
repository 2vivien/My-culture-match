/** Règles pures des lieux culturels (catégories, doublons, transitions de modération, quotas). */

export const PLACE_CATEGORIES = [
  'restaurant',
  'centre_culturel',
  'lieu_de_culte',
  'marche',
  'musee',
  'boutique',
  'association',
  'espace_public',
  'autre',
] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export const PLACE_STATUSES = ['pending', 'published', 'rejected'] as const;
export type PlaceStatus = (typeof PLACE_STATUSES)[number];

/** Un lieu proposé n'est jamais publié sans modération. */
export const PLACE_LIMITS = {
  /** Propositions en attente simultanées par personne. */
  maxPendingPerUser: 5,
  /** Propositions par personne et par 24 h. */
  maxProposalsPerDay: 10,
  /** Deux lieux de même nom plus proches que cela sont considérés comme un doublon. */
  duplicateRadiusMeters: 150,
} as const;

/** Nom comparable : minuscules, sans accents, sans ponctuation, espaces réduits. */
export function normalizePlaceName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Distance (mètres) entre deux points, formule de haversine. */
export function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface PlaceLike {
  name: string;
  latitude: number;
  longitude: number;
}

/** Vrai si un lieu existant a le même nom normalisé et se trouve dans le rayon de doublon. */
export function isDuplicatePlace(candidate: PlaceLike, existing: readonly PlaceLike[], radiusMeters: number = PLACE_LIMITS.duplicateRadiusMeters): boolean {
  const wanted = normalizePlaceName(candidate.name);
  if (!wanted) return false;
  return existing.some((p) => normalizePlaceName(p.name) === wanted && distanceMeters(candidate, p) <= radiusMeters);
}

export type ModerationAction = 'approve' | 'reject';

/**
 * Transitions autorisées : en attente → publié / refusé ; publié → refusé (retrait) ; refusé → publié (réexamen).
 * Appliquer deux fois la même décision est refusé (pas d'effet, évite les doubles traitements).
 */
export function nextPlaceStatus(current: PlaceStatus, action: ModerationAction): PlaceStatus | null {
  const target: PlaceStatus = action === 'approve' ? 'published' : 'rejected';
  return current === target ? null : target;
}

/** Un refus doit être motivé (le proposant voit la raison). */
export function isValidRejectionReason(reason: string | null | undefined): boolean {
  return typeof reason === 'string' && reason.trim().length >= 3 && reason.trim().length <= 300;
}

/**
 * Nombre de signalements ouverts, par des personnes distinctes, à partir duquel un lieu est MASQUÉ en attendant
 * la décision de la modération. Il n'est pas supprimé : un lieu légitime visé par des signalements abusifs
 * redevient visible dès que la modération classe les signalements.
 */
export const PLACE_AUTO_HIDE_REPORTS = 3;

export function shouldAutoHidePlace(openReportCount: number): boolean {
  return openReportCount >= PLACE_AUTO_HIDE_REPORTS;
}
