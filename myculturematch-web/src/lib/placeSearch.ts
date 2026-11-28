import { api } from '@/src/services/api';
import { mapGeocodeResults, type PlaceSearchResult } from './geocodeResults';

/** Recherche de lieu (géocodage) partagée par les écrans de la carte. */

export type { PlaceSearchResult } from './geocodeResults';

/**
 * Recherche un lieu par son nom via le proxy de géocodage du serveur (`GET /api/location/geocode`) :
 * ni l'adresse IP ni la recherche de l'utilisateur ne sont envoyées à un service tiers depuis le navigateur.
 */
export async function searchPlaces(query: string, limit = 5): Promise<PlaceSearchResult[]> {
  const payload = await api.get<{ results: unknown[] }>(`/api/location/geocode?q=${encodeURIComponent(query)}`);
  return mapGeocodeResults(payload).slice(0, limit);
}
