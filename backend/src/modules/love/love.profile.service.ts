import { eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { loveProfileSchema, LOVE_QUESTIONS, sensitiveCategoriesInProfile, type LoveProfileAnswers } from './love.profile';
import { sensitiveNotice, type SensitiveCategory } from './love.guardrails';

export interface LoveProfileDto { completed: boolean; answers: LoveProfileAnswers | null; questions: typeof LOVE_QUESTIONS; ignoredCategories?: SensitiveCategory[]; notice?: string }

/** Réponses enregistrées, ou null si la personne n'a pas encore fait le questionnaire (ou si elles sont illisibles). */
export async function getLoveProfileAnswers(userId: string): Promise<LoveProfileAnswers | null> {
  const [row] = await db.select({ answers: schema.loveProfiles.answers }).from(schema.loveProfiles).where(eq(schema.loveProfiles.userId, userId)).limit(1);
  if (!row) return null;
  const parsed = loveProfileSchema.safeParse(row.answers);
  return parsed.success ? parsed.data : null;
}

export async function getLoveProfile(userId: string): Promise<LoveProfileDto> {
  const answers = await getLoveProfileAnswers(userId);
  return { completed: answers !== null, answers, questions: LOVE_QUESTIONS };
}

/** PUT /api/love/profile — première réponse ou modification ultérieure. */
export async function saveLoveProfile(userId: string, answers: LoveProfileAnswers): Promise<LoveProfileDto> {
  await db.insert(schema.loveProfiles)
    .values({ userId, answers })
    .onConflictDoUpdate({ target: schema.loveProfiles.userId, set: { answers, updatedAt: new Date() } });
  const dto = await getLoveProfile(userId);
  // Transparence : ces éléments sont conservés sur le profil mais n'influencent jamais les recherches.
  const ignoredCategories = sensitiveCategoriesInProfile(answers);
  return ignoredCategories.length > 0
    ? { ...dto, ignoredCategories, notice: sensitiveNotice(ignoredCategories).trim() }
    : dto;
}
