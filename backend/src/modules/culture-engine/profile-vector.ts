import { eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { hashEmbedding, tokenize } from './embedding';

const DIMS = {
  hofstede_power_distance: 0.5,
  hofstede_individualism: 0.5,
  hofstede_masculinity: 0.5,
  hofstede_uncertainty_avoidance: 0.5,
  hofstede_long_term: 0.5,
  hofstede_indulgence: 0.5,
  schwartz_conservation: 0.5,
  schwartz_openness: 0.5,
  schwartz_self_enhancement: 0.5,
  schwartz_self_transcendence: 0.5,
  bigfive_openness: 0.5,
  bigfive_conscientiousness: 0.5,
  bigfive_extraversion: 0.5,
  bigfive_agreeableness: 0.5,
  bigfive_neuroticism: 0.5,
} as const;

/**
 * Construit le vecteur de profil utilisateur (768 dims) :
 * dimensions Hofstede/Schwartz/BigFive à 0.5 par défaut (V1) +
 * tokens racines / langues / valeurs / localisation, hashé et normalisé L2.
 */
export function buildUserProfileVector(user: {
  roots: unknown;
  values: string[] | null;
  languages: string[] | null;
  ethnicity: string | null;
  country: string | null;
  region: string | null;
}): Record<string, number> {
  const fixed = { ...DIMS };
  const rootValues = Object.values((user.roots ?? {}) as Record<string, unknown>).filter((v): v is string => typeof v === 'string' && v.length > 0);
  const tokens = [
    ...(user.values ?? []),
    ...(user.languages ?? []),
    ...rootValues,
    user.ethnicity ?? '',
    user.country ?? '',
    user.region ?? '',
  ];
  const hashed = hashEmbedding(tokenize(tokens.join(' ')), 768);
  return { ...fixed, ...hashed };
}

/** Recalcule et enregistre le vecteur d'un utilisateur (batch nightly). */
export async function recomputeUserVector(userId: string): Promise<void> {
  const [user] = await db
    .select({
      roots: schema.users.roots,
      values: schema.users.values,
      languages: schema.users.languages,
      ethnicity: schema.users.ethnicity,
      country: schema.users.country,
      region: schema.users.region,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!user) return;

  const vector = buildUserProfileVector(user);
  await db
    .insert(schema.userProfileVectors)
    .values({ userId, vector, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.userProfileVectors.userId, set: { vector, updatedAt: new Date() } });
}

/** Batch complet : tous les profils complétés. */
export async function recomputeAllProfileVectors(): Promise<number> {
  const rows = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.profileCompleted, true));
  for (const row of rows) {
    await recomputeUserVector(row.id);
  }
  return rows.length;
}
