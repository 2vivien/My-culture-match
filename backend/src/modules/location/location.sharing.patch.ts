/** Colonnes de `users` à écrire pour (dés)activer le partage de position — logique PURE. */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Colonnes de `users` à écrire quand le partage est COUPÉ : plus aucune coordonnée, plus aucun horodatage. */
export function sharingOffPatch(now: Date) {
  return { locationSharingEnabled: false as const, latitude: null, longitude: null, locationUpdatedAt: null, updatedAt: now };
}

/**
 * Colonnes de `users` à écrire quand le partage est ACTIVÉ. `locationUpdatedAt` n'est rafraîchi que si de
 * NOUVELLES coordonnées sont fournies : réactiver sans coordonnées ne doit pas faire passer une ancienne
 * position pour une position fraîche (ni, après purge, en inventer une).
 */
export function sharingOnPatch(coords: Partial<Coordinates> | undefined, now: Date) {
  const fresh = coords !== undefined && Number.isFinite(coords.latitude) && Number.isFinite(coords.longitude);
  return fresh
    ? { locationSharingEnabled: true as const, latitude: coords.latitude as number, longitude: coords.longitude as number, locationUpdatedAt: now, updatedAt: now }
    : { locationSharingEnabled: true as const, updatedAt: now };
}
