/** Lecture de la réponse du géocodage serveur (logique pure, sans réseau). */

export interface PlaceSearchResult {
  key: string;
  label: string;
  latitude: number;
  longitude: number;
}

/** Transforme la réponse de `GET /api/location/geocode` en résultats affichables (lat/lon valides, libellé court). */
export function mapGeocodeResults(payload: unknown): PlaceSearchResult[] {
  const rows = (payload as { results?: unknown } | null)?.results;
  if (!Array.isArray(rows)) return [];
  const out: PlaceSearchResult[] = [];
  for (const row of rows) {
    if (typeof row !== 'object' || row === null) continue;
    const { label, latitude, longitude } = row as { label?: unknown; latitude?: unknown; longitude?: unknown };
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    const short = typeof label === 'string' ? label.split(',').slice(0, 2).join(',').trim() : '';
    out.push({ key: `${out.length}:${latitude},${longitude}`, label: short || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, latitude, longitude });
  }
  return out;
}
