import { z } from 'zod';

const criteriaSchema = z.object({
  ageMin: z.number().int().min(18).max(100).optional(),
  ageMax: z.number().int().min(18).max(100).optional(),
  genders: z.array(z.enum(['female', 'male', 'non-binary'])).max(3).optional(),
  countries: z.array(z.string().trim().min(2).max(80)).max(10).optional(),
  relationshipGoal: z.enum(['serious', 'casual', 'friendship', 'open']).optional(),
  keywords: z.array(z.string().trim().min(2).max(40)).max(12).optional(),
  distanceKm: z.number().min(1).max(5000).optional(),
}).superRefine((v, ctx) => {
  if (v.ageMin !== undefined && v.ageMax !== undefined && v.ageMin > v.ageMax) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ageMin'], message: 'ageMin must be <= ageMax' });
  }
});

export type LoveSearchCriteria = z.infer<typeof criteriaSchema>;

function normalized(value: string | null | undefined): string {
  return (value ?? '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function deterministicParse(query: string): LoveSearchCriteria {
  const q = normalized(query);
  const ages = q.match(/(?:entre|de)\s*(\d{2})\s*(?:et|a|à|-)\s*(\d{2})/);
  const criteria: LoveSearchCriteria = {};
  if (ages) { criteria.ageMin = Number(ages[1]); criteria.ageMax = Number(ages[2]); }
  if (/femme|femmes|une femme/.test(q)) criteria.genders = ['female'];
  else if (/homme|hommes|un homme/.test(q)) criteria.genders = ['male'];
  if (/serieuse|serieux|engagement|long terme|mariage/.test(q)) criteria.relationshipGoal = 'serious';
  else if (/sans engagement|casual|legere/.test(q)) criteria.relationshipGoal = 'casual';
  if (/pres|proche|voisin|voisine|ma region/.test(q)) criteria.distanceKm = 50;
  const keywords = ['voyage', 'voyager', 'culture', 'musique', 'sport', 'lecture', 'cuisine', 'famille', 'ouvert', 'ouverte', 'spirituel', 'aventure'];
  criteria.keywords = keywords.filter((k) => q.includes(k));
  return criteriaSchema.parse(criteria);
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? text.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) throw new Error('AI response did not contain JSON');
  return JSON.parse(candidate);
}

export async function parseLoveQuery(query: string): Promise<LoveSearchCriteria> {
  const fallback = deterministicParse(query);
  if (process.env.LOVE_AI_ENABLED !== 'true' || !process.env.LOVE_AI_API_KEY || !process.env.LOVE_AI_MODEL) return fallback;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.LOVE_AI_TIMEOUT_MS ?? 8000));
  try {
    const response = await fetch(`${(process.env.LOVE_AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.LOVE_AI_API_KEY}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.LOVE_AI_MODEL,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Tu es le parseur de recherche Love de My Culture Match. Transforme uniquement la demande utilisateur en JSON strict. N’invente jamais une préférence absente. Champs autorisés: ageMin, ageMax, genders (female|male|non-binary), countries, relationshipGoal (serious|casual|friendship|open), keywords, distanceKm. Les préférences relationnelles doivent rester des critères de recherche, jamais une décision sur une personne.' },
          { role: 'user', content: query },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Love AI HTTP ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return criteriaSchema.parse(extractJson(data.choices?.[0]?.message?.content ?? ''));
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}
