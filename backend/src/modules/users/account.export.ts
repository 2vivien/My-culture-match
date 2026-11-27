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

/** Phrase que l'utilisateur doit recopier pour supprimer son compte (action irréversible). */
export const DELETE_CONFIRMATION = 'SUPPRIMER MON COMPTE';

export function isDeleteConfirmed(input: unknown): boolean {
  return typeof input === 'string' && input.trim().toUpperCase() === DELETE_CONFIRMATION;
}

/** Les sections de l'export, dans l'ordre de présentation. */
export const EXPORT_SECTIONS = [
  'profile', 'settings', 'consent', 'locationSettings', 'posts', 'comments',
  'messagesSent', 'connections', 'loveMatches', 'blocks', 'notifications', 'stories', 'tribes',
] as const;
