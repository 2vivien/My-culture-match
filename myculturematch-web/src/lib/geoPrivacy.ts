/** Confidentialité de la position envoyée au serveur. */

/** 2 décimales ≈ 1 km : suffisant pour « à proximité », sans transmettre le point GPS exact. */
export const COORD_DECIMALS = 2;

export function roundCoord(value: number, decimals = COORD_DECIMALS): number {
  const f = 10 ** decimals;
  const r = Math.round(value * f) / f;
  return Object.is(r, -0) ? 0 : r;
}

/** Query string `?lat=&lon=` arrondie, ou chaîne vide si la position est absente ou invalide. */
export function coarsePositionQuery(coords?: { latitude: number; longitude: number } | null): string {
  if (!coords || !Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) return '';
  return `?lat=${roundCoord(coords.latitude)}&lon=${roundCoord(coords.longitude)}`;
}
