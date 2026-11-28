import { createHmac } from 'node:crypto';
import type { LocationPrecision } from './location.schema';

/** Taille de cellule en degrés (≈ 1,1 km pour `approximate`, ≈ 5,5 km pour `area`). */
export const CELL_DEGREES: Record<LocationPrecision, number> = { approximate: 0.01, area: 0.05 };

/** Le décalage reste dans ±OFFSET_RATIO × cellule autour du centre : jamais hors de la cellule. */
const OFFSET_RATIO = 0.35;

/** Secret du floutage : variable dédiée si elle est définie, sinon repli sur le secret d'authentification. */
export function jitterSecret(config: { LOCATION_JITTER_SECRET?: string | undefined; BETTER_AUTH_SECRET: string }): string {
  return config.LOCATION_JITTER_SECRET ? config.LOCATION_JITTER_SECRET : config.BETTER_AUTH_SECRET;
}

function unit(secret: string, label: string): number {
  const digest = createHmac('sha256', secret).update(label).digest();
  return digest.readUInt32BE(0) / 0xffffffff; // [0, 1]
}

/**
 * Position publique d'un utilisateur : centre de la cellule de grille qui contient sa position,
 * plus un décalage constant dérivé d'un secret serveur (HMAC) pour ne pas empiler les marqueurs.
 *
 * Propriétés recherchées :
 * - la position exacte n'est jamais révélée, seulement sa cellule ;
 * - le décalage dépend d'un secret : un tiers ne peut pas le recalculer à partir de l'id public
 *   (l'ancien jitter dépendait du seul id, donc était réversible) ;
 * - tant que l'utilisateur reste dans la même cellule, la position publiée est identique, donc
 *   moyenner ou recouper des requêtes successives n'apprend rien de plus.
 */
export function obfuscatePosition(
  latitude: number,
  longitude: number,
  userId: string,
  precision: LocationPrecision,
  secret: string,
): { latitude: number; longitude: number } {
  const size = CELL_DEGREES[precision];
  const row = Math.floor(latitude / size);
  const col = Math.floor(longitude / size);
  const cell = `${precision}:${row}:${col}`;
  const offsetLat = (unit(secret, `${userId}|${cell}|lat`) - 0.5) * 2 * OFFSET_RATIO * size;
  const offsetLon = (unit(secret, `${userId}|${cell}|lon`) - 0.5) * 2 * OFFSET_RATIO * size;
  return {
    latitude: (row + 0.5) * size + offsetLat,
    longitude: (col + 0.5) * size + offsetLon,
  };
}
