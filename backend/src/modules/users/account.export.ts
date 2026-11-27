/** Fonctions pures de l'export de données personnelles (sans base ni Redis) : testables unitairement. */

/** Champs jamais exportés : secrets, jetons et empreintes internes. */
const SENSITIVE_KEY = /(secret|token|hash|password|otp|salt|session)/i;

/** Retire récursivement les champs sensibles et convertit les dates en ISO pour un JSON stable. */
export function redactForExport<T>(value: T): T {
  if (value instanceof Date) return value.toISOString() as unknown as T;
  if (Array.isArray(value)) return value.map((v) => redactForExport(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY.test(key)) continue;
      out[key] = redactForExport(v);
    }
    return out as T;
  }
  return value;
}

export interface LoveProfileRow {
  answers: unknown;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  [extra: string]: unknown;
}

/**
 * Profil Love (réponses au questionnaire) tel qu'exporté : uniquement les réponses de la personne et les
 * dates, par liste blanche (aucune autre colonne, aucun contenu d'un tiers). `null` si le questionnaire
 * n'a jamais été rempli. Le résultat passe ensuite par redactForExport.
 */
export function shapeLoveProfileForExport(row: LoveProfileRow | null | undefined): { answers: unknown; createdAt: Date | string | null; updatedAt: Date | string | null } | null {
  if (!row) return null;
  return { answers: row.answers ?? null, createdAt: row.createdAt ?? null, updatedAt: row.updatedAt ?? null };
}

/** Phrase que l'utilisateur doit recopier pour supprimer son compte (action irréversible). */
export const DELETE_CONFIRMATION = 'SUPPRIMER MON COMPTE';

export function isDeleteConfirmed(input: unknown): boolean {
  return typeof input === 'string' && input.trim().toUpperCase() === DELETE_CONFIRMATION;
}

/** Les sections de l'export, dans l'ordre de présentation. */
export const EXPORT_SECTIONS = [
  'profile', 'settings', 'consent', 'locationSettings', 'posts', 'comments',
  'messagesSent', 'connections', 'loveMatches', 'loveProfile', 'blocks', 'notifications', 'stories', 'tribes',
] as const;
