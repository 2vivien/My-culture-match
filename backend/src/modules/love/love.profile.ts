import { z } from 'zod';

/** Vocabulaires contrôlés (docs/love-algorithm/01-onboarding-and-features.md). */
export const LOVE_GOALS = ['serious', 'progressive', 'open', 'intercultural'] as const;
export const LOVE_RELATIONSHIPS = ['serious', 'casual', 'slow', 'unsure'] as const;
export const LOVE_VALUES = ['respect', 'honesty', 'fidelity', 'freedom', 'family', 'ambition', 'curiosity', 'spirituality', 'humor', 'stability', 'adventure', 'empathy', 'communication', 'independence', 'creativity'] as const;
export const LOVE_LIFESTYLE = ['travel', 'music', 'sport', 'cooking', 'reading', 'art', 'entrepreneurship', 'technology', 'nature', 'going-out', 'games', 'cinema', 'learning', 'family', 'culture', 'languages'] as const;
export const LOVE_DISTANCES = ['city', 'km25', 'km50', 'km100', 'country', 'international'] as const;

const unique = <T extends z.ZodTypeAny>(item: T, min: number, max: number) =>
  z.array(item).min(min).max(max).refine((a) => new Set(a).size === a.length, 'Valeurs en double');

/** Les 6 questions de première utilisation de Love ; chaque réponse reste modifiable. */
export const loveProfileSchema = z
  .object({
    goals: unique(z.enum(LOVE_GOALS), 1, 4),
    relationship: z.enum(LOVE_RELATIONSHIPS),
    values: unique(z.enum(LOVE_VALUES), 3, 5),
    lifestyle: unique(z.enum(LOVE_LIFESTYLE), 5, 8),
    distance: z.enum(LOVE_DISTANCES),
    understood: z.string().trim().max(500).optional(),
  })
  .strict();

export type LoveProfileAnswers = z.infer<typeof loveProfileSchema>;

const DISTANCE_KM: Record<(typeof LOVE_DISTANCES)[number], number | undefined> = {
  city: 15,
  km25: 25,
  km50: 50,
  km100: 100,
  country: undefined,
  international: undefined,
};

const GOAL_FROM_RELATIONSHIP: Record<(typeof LOVE_RELATIONSHIPS)[number], 'serious' | 'casual' | 'open'> = {
  serious: 'serious',
  casual: 'casual',
  slow: 'open',
  unsure: 'open',
};

/**
 * Valeurs par défaut d'une recherche Love issues du profil : elles ne complètent que ce que la
 * personne n'a pas dit dans sa demande (ce qu'elle écrit maintenant prime sur son profil).
 */
export function profileSearchDefaults(answers: LoveProfileAnswers): { relationshipGoal: 'serious' | 'casual' | 'open'; distanceKm?: number } {
  const distanceKm = DISTANCE_KM[answers.distance];
  return { relationshipGoal: GOAL_FROM_RELATIONSHIP[answers.relationship], ...(distanceKm !== undefined ? { distanceKm } : {}) };
}

/** Catalogue servi au front pour construire le questionnaire sans dupliquer les vocabulaires. */
export const LOVE_QUESTIONS = [
  { key: 'goals', kind: 'multi', min: 1, max: 4, options: LOVE_GOALS },
  { key: 'relationship', kind: 'single', options: LOVE_RELATIONSHIPS },
  { key: 'values', kind: 'multi', min: 3, max: 5, options: LOVE_VALUES },
  { key: 'lifestyle', kind: 'multi', min: 5, max: 8, options: LOVE_LIFESTYLE },
  { key: 'distance', kind: 'single', options: LOVE_DISTANCES },
  { key: 'understood', kind: 'text', max: 500, optional: true },
] as const;
