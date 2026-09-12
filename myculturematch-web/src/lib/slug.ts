/**
 * Transforme un texte libre en tag API valide : minuscules, chiffres et tirets
 * uniquement (regex backend ^[a-z0-9-]+$), max 24 caractères.
 * "Cuisine Bénin 🍲" -> "cuisine-benin"
 */
export function slugifyTag(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}
