/** Extrait les hashtags d'un texte (ex. #culture → culture). */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#([a-z0-9àâäéèêëîïôöùûüçœ-]+)/gi);
  if (!matches) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const match of matches) {
    const tag = match.slice(1).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (tag.length < 2 || tag.length > 30) continue;
    if (seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
    if (tags.length >= 5) break;
  }
  return tags;
}

/** Valide qu'une URL est publiquement accessible (pas localhost/file://). */
export function isValidPublicUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '0.0.0.0') return false;
    if (/^file:/i.test(raw)) return false;
    return true;
  } catch {
    return false;
  }
}
