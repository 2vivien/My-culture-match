import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { rateLimitHit } from '../../shared/utils/rate-limit';
import { normalizeGeocodeQuery, parseGeocodeResponse, type GeocodeResult } from './geocode.parse';

export type { GeocodeResult };

const GEOCODER_URL = process.env.GEOCODER_URL ?? 'https://nominatim.openstreetmap.org/search';
const CACHE_TTL_SECONDS = 24 * 60 * 60;
const LIMIT_PER_MINUTE = 20;
const TIMEOUT_MS = 5000;

/**
 * Géocodage côté serveur : le navigateur ne contacte plus le service tiers (fuite de la requête
 * et de l'IP, limites de débit partagées). Résultats mis en cache 24 h, 20 requêtes/min/utilisateur.
 */
export async function geocode(userId: string, rawQuery: string): Promise<GeocodeResult[]> {
  const q = normalizeGeocodeQuery(rawQuery);
  if (q.length < 2 || q.length > 120) throw AppError.badRequest('Recherche de lieu invalide', 'INVALID_GEOCODE_QUERY');

  const key = `geocode:${q}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as GeocodeResult[];

  const rate = await rateLimitHit(`geocode:${userId}`, LIMIT_PER_MINUTE, 60);
  if (!rate.allowed) throw AppError.tooMany('Trop de recherches de lieu, réessaie dans un instant', 'RATE_LIMITED');

  const url = new URL(GEOCODER_URL);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '5');
  url.searchParams.set('q', rawQuery.trim());
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'mcm-geocoder/1.0' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null);
  if (!response?.ok) throw new AppError(502, 'GEOCODER_UNAVAILABLE', 'Service de géocodage indisponible');

  const results = parseGeocodeResponse(await response.json().catch(() => null));
  await redis.set(key, JSON.stringify(results), 'EX', CACHE_TTL_SECONDS);
  return results;
}
