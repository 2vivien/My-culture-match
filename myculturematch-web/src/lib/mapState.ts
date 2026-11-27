/** États affichés par la carte People Nearby (logique pure, sans React ni DOM). */

export type MapStatus = 'loading' | 'error' | 'ghost' | 'not-sharing' | 'empty' | 'ready';

export interface MapStatusInput {
  loading: boolean;
  /** Le dernier chargement a échoué (réseau, serveur). */
  failed: boolean;
  sharingEnabled: boolean;
  ghostMode: boolean;
  /** Nombre de personnes visibles après filtre. */
  visibleCount: number;
}

/** Statut principal de la carte. Le chargement initial prime ; une erreur prime sur un état vide trompeur. */
export function computeMapStatus(i: MapStatusInput): MapStatus {
  if (i.loading) return 'loading';
  if (i.failed) return 'error';
  if (i.ghostMode) return 'ghost';
  if (!i.sharingEnabled) return 'not-sharing';
  if (i.visibleCount === 0) return 'empty';
  return 'ready';
}

export type GeoProblem = 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'unknown';

/** Classe une erreur de géolocalisation du navigateur (GeolocationPositionError.code : 1, 2, 3). */
export function classifyGeoError(error: unknown): GeoProblem {
  if (typeof navigator !== 'undefined' && !('geolocation' in navigator)) return 'unsupported';
  const code = (error as { code?: number } | null)?.code;
  if (code === 1) return 'denied';
  if (code === 2) return 'unavailable';
  if (code === 3) return 'timeout';
  return 'unknown';
}

export const GEO_MESSAGES: Record<GeoProblem, { title: string; hint: string }> = {
  denied: { title: 'Localisation refusée', hint: 'Autorise la localisation pour ce site dans les réglages de ton navigateur, puis réessaie.' },
  unavailable: { title: 'Position introuvable', hint: 'Ton appareil n’arrive pas à te localiser. Vérifie le GPS ou ta connexion, puis réessaie.' },
  timeout: { title: 'Localisation trop longue', hint: 'La position n’a pas répondu à temps. Réessaie dans un endroit mieux couvert.' },
  unsupported: { title: 'Localisation non prise en charge', hint: 'Ce navigateur ne permet pas de te localiser.' },
  unknown: { title: 'Localisation impossible', hint: 'Une erreur est survenue. Réessaie dans un instant.' },
};
