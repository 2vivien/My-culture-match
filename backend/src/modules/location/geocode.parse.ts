// Fonctions pures du géocodage (sans Redis ni env) : testables unitairement.

export interface GeocodeResult { label: string; latitude: number; longitude: number }

/** Clé de cache stable : casse, espaces et accents n'ouvrent pas d'entrées différentes. */
export function normalizeGeocodeQuery(q: string): string {
  return q.trim().toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
}

/** Extrait au plus 5 résultats valides d'une réponse Nominatim (jsonv2), ignore le reste. */
export function parseGeocodeResponse(payload: unknown): GeocodeResult[] {
  if (!Array.isArray(payload)) return [];
  const out: GeocodeResult[] = [];
  for (const item of payload) {
    if (typeof item !== 'object' || item === null) continue;
    const { lat, lon, display_name: label } = item as Record<string, unknown>;
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) continue;
    out.push({ label: typeof label === 'string' ? label.slice(0, 200) : '', latitude, longitude });
    if (out.length === 5) break;
  }
  return out;
}

