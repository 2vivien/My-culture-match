import { z } from 'zod';
import { parseLoveQuery, type LoveSearchCriteria } from './love.ai';
import { searchLove } from './love.service';

export const loveConversationSchema = z.object({
  messages: z.array(z.string().trim().min(1).max(1000)).min(1).max(12),
});

export type LoveConversationResult = {
  reply: string;
  phase: 'clarifying' | 'results';
  criteria: LoveSearchCriteria;
  missing: string[];
  remainingSearches: number;
  results?: Awaited<ReturnType<typeof searchLove>>['results'];
};

function missingCriteria(criteria: LoveSearchCriteria): string[] {
  const missing: string[] = [];
  if (!criteria.genders?.length) missing.push('gender');
  if (criteria.ageMin === undefined && criteria.ageMax === undefined) missing.push('age');
  if (!criteria.relationshipGoal) missing.push('goal');
  return missing;
}

function replyFor(missing: string[], hasResults: boolean): string {
  if (hasResults) return 'Voilà ma sélection. J’ai gardé seulement les 4 profils les plus pertinents selon tes critères et les règles de consentement.';
  if (missing[0] === 'gender') return 'D’accord. Tu recherches plutôt une femme, un homme, ou tu es ouvert aux deux ?';
  if (missing[0] === 'age') return 'Très bien. Tu as une tranche d’âge en tête, ou tu préfères que je laisse ce critère ouvert ?';
  if (missing[0] === 'goal') return 'Et côté relation, tu recherches plutôt quelque chose de sérieux, sans engagement, ou tu préfères voir où ça mène ?';
  return 'J’ai compris. Je prépare une sélection qui correspond au mieux à ta recherche.';
}

export async function handleLoveConversation(userId: string, messages: string[]): Promise<LoveConversationResult> {
  const combined = messages.join('\n');
  const criteria = await parseLoveQuery(combined);
  const missing = missingCriteria(criteria);
  if (missing.length > 0) {
    const quota = await import('./love.service').then((m) => m.getLoveSearchQuota(userId));
    return { reply: replyFor(missing, false), phase: 'clarifying', criteria, missing, remainingSearches: quota.remaining };
  }
  const result = await searchLove(userId, combined);
  return { reply: replyFor([], true), phase: 'results', criteria, missing: [], remainingSearches: result.remainingSearches, results: result.results };
}
