/**
 * Garde-fous des critères de recherche Love (docs/love-algorithm/08-safety-fairness-and-privacy.md) :
 * aucune catégorie sensible ne devient un critère de tri ou de filtrage, que la demande vienne de
 * l'analyse déterministe ou d'un modèle de langage.
 *
 * Les origines culturelles et pays restent des critères légitimes du produit ; sont exclus ici la
 * religion, la santé / le handicap, l'orientation sexuelle, les opinions politiques et la couleur de peau.
 */
export type SensitiveCategory = 'religion' | 'santé' | 'orientation' | 'opinions politiques' | 'couleur de peau';

const SENSITIVE_PATTERNS: Array<{ category: SensitiveCategory; pattern: RegExp }> = [
  { category: 'religion', pattern: /\b(musulman\w*|chretien\w*|catholique\w*|protestant\w*|juif\w*|juive\w*|hindou\w*|bouddhiste\w*|sikh\w*|athee\w*|religieu\w*|religion|pratiquant\w*|islam\w*|christian\w*|muslim\w*|jewish|hindu|buddhist|atheist)\b/ },
  { category: 'santé', pattern: /\b(handicap\w*|malad\w*|vih|sida|depress\w*|cancer|diabet\w*|disabled|disability|hiv)\b/ },
  { category: 'orientation', pattern: /\b(gay|gays|lesbienne\w*|homosexuel\w*|heterosexuel\w*|bisexuel\w*|transgenre\w*|queer|lgbt\w*|straight|homosexual|bisexual)\b/ },
  { category: 'opinions politiques', pattern: /\b(politique\w*|de gauche|de droite|conservat\w*|liberal\w*|communiste\w*|republicain\w*|democrate\w*|extreme droite|extreme gauche)\b/ },
  { category: 'couleur de peau', pattern: /\b(peau (claire|foncee|noire|blanche|mate)|(femme|homme|fille|garcon|gars|personne)s? (noire|noir|blanche|blanc|metisse|metis|basanee|basane)s?)\b/ },
];

function normalize(value: string): string {
  return value.toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Catégories sensibles mentionnées dans un texte libre (sans doublon). */
export function detectSensitiveCategories(text: string): SensitiveCategory[] {
  const normalized = normalize(text);
  const found = new Set<SensitiveCategory>();
  for (const { category, pattern } of SENSITIVE_PATTERNS) if (pattern.test(normalized)) found.add(category);
  return [...found];
}

/** Retire des mots-clés tout terme sensible : ils ne doivent jamais atteindre le moteur de classement. */
export function stripSensitiveKeywords(keywords: string[] | undefined): string[] {
  return (keywords ?? []).filter((k) => detectSensitiveCategories(k).length === 0);
}

/** Phrase de transparence ajoutée à la réponse de l'IA quand des critères sensibles ont été ignorés. */
export function sensitiveNotice(categories: SensitiveCategory[]): string {
  if (categories.length === 0) return '';
  return ` Je n’utilise pas de critères liés à : ${categories.join(', ')}.`;
}
