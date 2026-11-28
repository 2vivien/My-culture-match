/** Motifs proposés pour signaler un lieu culturel, et corps de la requête correspondant (POST /api/reports). */

export const PLACE_REPORT_REASONS = [
  { id: 'private_address', label: 'Adresse privée ou personnelle', hint: 'Un domicile ou un lieu qui n’est pas ouvert au public.' },
  { id: 'spam', label: 'Spam ou publicité', hint: 'Contenu commercial ou répétitif.' },
  { id: 'other', label: 'Autre problème', hint: 'Information fausse, lieu inexistant, contenu inapproprié…' },
] as const;

export type PlaceReportReasonId = (typeof PLACE_REPORT_REASONS)[number]['id'];

/** Corps envoyé au serveur. Le motif « adresse privée » est transmis dans la description pour la modération. */
export function placeReportPayload(placeId: string, reason: PlaceReportReasonId): { targetType: 'place'; targetId: string; reason: 'spam' | 'other'; description?: string } {
  return {
    targetType: 'place',
    targetId: placeId,
    reason: reason === 'spam' ? 'spam' : 'other',
    ...(reason === 'private_address' ? { description: 'adresse_privee' } : {}),
  };
}

const MESSAGES: Record<string, string> = {
  REPORT_DUPLICATE: 'Tu as déjà signalé ce lieu : la modération va l’examiner.',
  REPORT_TARGET_NOT_FOUND: 'Ce lieu n’est plus disponible.',
};

/** Message en français pour une erreur de signalement. */
export function placeReportError(code: string): string {
  return MESSAGES[code] ?? 'Signalement impossible. Réessaie dans un instant.';
}
