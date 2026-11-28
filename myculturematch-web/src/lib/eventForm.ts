/** Aides pures du formulaire d'événement (conversion de date, messages d'erreur serveur, libellés). */

/** Convertit la valeur d'un `<input type="datetime-local">` (heure locale, sans fuseau) en ISO 8601 avec fuseau. */
export function toIsoFromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const MESSAGES: Record<string, string> = {
  EVENT_PUBLIC_REQUIRES_PUBLISHED_PLACE: 'Un événement public doit avoir lieu dans un lieu culturel validé.',
  EVENT_LOCATION_REQUIRED: 'Choisis un lieu pour cet événement.',
  EVENT_START_IN_PAST: 'Le début est déjà passé.',
  EVENT_END_BEFORE_START: 'La fin doit être après le début.',
  EVENT_TOO_LONG: 'Un événement dure 7 jours au maximum.',
  EVENT_TOO_FAR: 'Un événement doit commencer dans l’année.',
  EVENT_RATE_LIMITED: 'Trop d’événements créés aujourd’hui, réessaie demain.',
  EVENT_UPCOMING_LIMIT: 'Tu as déjà 10 événements à venir.',
};

/** Message en français pour un code d'erreur du serveur ; repli générique pour un code inconnu. */
export function eventErrorMessage(code: string): string {
  return MESSAGES[code] ?? 'Création impossible. Vérifie les champs puis réessaie.';
}

/** Libellé de date court en français (« ven. 27 nov., 18:30 »). */
export function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
