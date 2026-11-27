/** Catégories de lieux culturels (identiques à backend/src/modules/places/places.policy.ts). */
export const PLACE_CATEGORY_LABELS = {
  restaurant: { label: 'Restaurant', icon: '🍽️' },
  centre_culturel: { label: 'Centre culturel', icon: '🎭' },
  lieu_de_culte: { label: 'Lieu de culte', icon: '🕌' },
  marche: { label: 'Marché', icon: '🛍️' },
  musee: { label: 'Musée', icon: '🏛️' },
  boutique: { label: 'Boutique', icon: '🏪' },
  association: { label: 'Association', icon: '🤝' },
  espace_public: { label: 'Espace public', icon: '🌳' },
  autre: { label: 'Autre', icon: '📍' },
} as const;

export type PlaceCategoryId = keyof typeof PLACE_CATEGORY_LABELS;

export const PLACE_CATEGORY_IDS = Object.keys(PLACE_CATEGORY_LABELS) as PlaceCategoryId[];

/** Libellé et icône d'une catégorie, avec repli sur « Autre » pour une valeur inconnue du serveur. */
export function placeCategory(id: string): { label: string; icon: string } {
  return (PLACE_CATEGORY_LABELS as Record<string, { label: string; icon: string }>)[id] ?? PLACE_CATEGORY_LABELS.autre;
}
