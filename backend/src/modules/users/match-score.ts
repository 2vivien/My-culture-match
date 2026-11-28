/**
 * Score d'affinité (0-100) entre deux profils, affiché sur la carte et dans les listes de proches.
 *
 * Dimensions et poids : valeurs partagées (50), langues partagées (30), pays d'origine (20).
 * Une dimension n'entre dans le calcul que si les DEUX profils l'ont renseignée : un profil incomplet
 * n'est pas pénalisé, il est simplement comparé sur ce qui existe. Sans aucune dimension comparable, le score vaut 0.
 *
 * Volontairement exclu : l'ethnie et la région. Ce sont des données sensibles et un score qui en dépend
 * permettrait de les déduire (« 100 % = même ethnie »), même si le profil les masque.
 */
export interface MatchProfile {
  values?: readonly string[] | null;
  languages?: readonly string[] | null;
  country?: string | null;
}

const WEIGHTS = { values: 50, languages: 30, country: 20 } as const;

const norm = (s: string) => s.trim().toLowerCase();
const cleaned = (list: readonly string[] | null | undefined): Set<string> => new Set((list ?? []).map(norm).filter(Boolean));

/** Indice de Jaccard : |A ∩ B| / |A ∪ B|, entre 0 et 1. */
function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function computeMatchScore(a: MatchProfile, b: MatchProfile): number {
  let weighted = 0;
  let totalWeight = 0;

  const av = cleaned(a.values);
  const bv = cleaned(b.values);
  if (av.size > 0 && bv.size > 0) {
    weighted += WEIGHTS.values * jaccard(av, bv);
    totalWeight += WEIGHTS.values;
  }

  const al = cleaned(a.languages);
  const bl = cleaned(b.languages);
  if (al.size > 0 && bl.size > 0) {
    weighted += WEIGHTS.languages * jaccard(al, bl);
    totalWeight += WEIGHTS.languages;
  }

  const ac = a.country ? norm(a.country) : '';
  const bc = b.country ? norm(b.country) : '';
  if (ac && bc) {
    weighted += WEIGHTS.country * (ac === bc ? 1 : 0);
    totalWeight += WEIGHTS.country;
  }

  if (totalWeight === 0) return 0;
  return Math.round((100 * weighted) / totalWeight);
}
