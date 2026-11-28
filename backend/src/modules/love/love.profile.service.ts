import { eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { loveProfileSchema, LOVE_QUESTIONS, type LoveProfileAnswers } from './love.profile';

export interface LoveProfileDto { completed: boolean; answers: LoveProfileAnswers | null; questions: typeof LOVE_QUESTIONS }

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
  return getLoveProfile(userId);
}
