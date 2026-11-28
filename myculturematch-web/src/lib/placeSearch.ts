/** Recherche de lieu (géocodage) partagée par les écrans de la carte. */

export interface PlaceSearchResult {
  key: string;
  label: string;
  latitude: number;
  longitude: number;
}

/**
 * Recherche un lieu par son nom. Appelle Nominatim directement depuis le navigateur, comme la recherche de la carte ;
 * à basculer sur le proxy de géocodage serveur (GET /api/location/geocode) quand il sera disponible.
 */
export async function searchPlaces(query: string, limit = 5): Promise<PlaceSearchResult[]> {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${limit}&q=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/json', 'Accept-Language': 'fr' },
  });
  if (!res.ok) throw new Error('search failed');
  const rows = (await res.json()) as Array<{ place_id: number; display_name: string; lat: string; lon: string }>;
  return rows
    .map((r) => ({ key: String(r.place_id), label: r.display_name.split(',').slice(0, 2).join(',').trim(), latitude: Number(r.lat), longitude: Number(r.lon) }))
    .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
}
