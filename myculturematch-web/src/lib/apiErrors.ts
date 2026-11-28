/** Messages d'erreur français pour une action utilisateur, d'après le statut HTTP de l'erreur API. */

interface ErrorLike {
  status?: unknown;
  code?: unknown;
  message?: unknown;
}

const BY_STATUS: Record<number, string> = {
  401: 'Ta session a expiré. Reconnecte-toi puis réessaie.',
  403: 'Tu n’as pas le droit de faire cette action.',
  404: 'Cet élément n’existe plus. Actualise la carte.',
  409: 'Cette action est en conflit avec l’état actuel. Actualise puis réessaie.',
  429: 'Trop de tentatives. Patiente un instant puis réessaie.',
};

/** Message dédié aux statuts 401/403/404/409/429 ; sinon le message du serveur s'il en a fourni un ; sinon `fallback`. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = (typeof err === 'object' && err !== null ? err : {}) as ErrorLike;
  if (typeof e.status === 'number' && BY_STATUS[e.status]) return BY_STATUS[e.status];
  // `code` vaut « API_ERROR » quand le serveur n'a pas fourni d'erreur structurée : son message est alors technique.
  if (typeof e.status === 'number' && typeof e.code === 'string' && e.code !== 'API_ERROR' && typeof e.message === 'string' && e.message.trim()) return e.message;
  if (e instanceof TypeError) return 'Connexion impossible. Vérifie ton réseau puis réessaie.';
  return fallback;
}

/** Vrai pour une erreur de géolocalisation du navigateur (code numérique 1 à 3), faux pour une erreur d'API. */
export function isGeolocationError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as ErrorLike;
  if (typeof e.status === 'number') return false;
  return typeof e.code === 'number' && e.code >= 1 && e.code <= 3;
}
