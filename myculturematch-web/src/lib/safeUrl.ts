/** URL d'image sûre à affecter à `img.src` : http(s) uniquement, sans caractère de rupture de balise ni d'attribut. */

const MAX_LENGTH = 2048;
const BREAKING_CHARS = new Set(['"', '<', '>', '`', String.fromCharCode(92)]);

/** Caractère interdit : espace, contrôle (code < 33 ou DEL) ou ayant un sens dans un attribut HTML. */
function hasForbiddenChar(value: string): boolean {
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code <= 32 || code === 127 || BREAKING_CHARS.has(ch)) return true;
    // Espaces Unicode (NBSP, séparateurs de ligne…) : mêmes risques de confusion qu'un espace.
    if (/\s/.test(ch)) return true;
  }
  return false;
}

/**
 * Retourne l'URL normalisée si elle est en `http:` ou `https:`, sinon `null`
 * (`javascript:`, `data:`, `blob:`, URL relatives, guillemets, espaces, caractères de contrôle…).
 * Les valeurs venant du serveur (avatars, médias) ne doivent jamais être injectées en HTML : ceci reste
 * une seconde barrière pour les affecter à `img.src`.
 */
export function safeImageUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value || value.length > MAX_LENGTH || hasForbiddenChar(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
