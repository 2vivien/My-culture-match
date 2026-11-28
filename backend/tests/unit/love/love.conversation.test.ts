import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  parseLoveQuery: vi.fn(),
  searchLove: vi.fn(),
  getLoveSearchQuota: vi.fn(),
  getLoveProfileAnswers: vi.fn(),
}));
vi.mock('../../../src/modules/love/love.ai', () => ({ parseLoveQuery: h.parseLoveQuery }));
vi.mock('../../../src/modules/love/love.service', () => ({
  searchLove: h.searchLove,
  getLoveSearchQuota: h.getLoveSearchQuota,
}));
vi.mock('../../../src/modules/love/love.profile.service', () => ({ getLoveProfileAnswers: h.getLoveProfileAnswers }));

import { handleLoveConversation, loveConversationSchema } from '../../../src/modules/love/love.conversation';

const profile = {
  goals: ['serious'],
  relationship: 'casual',
  values: ['respect', 'honesty', 'family'],
  lifestyle: ['travel', 'music', 'sport', 'cooking', 'reading'],
  distance: 'km25',
};

beforeEach(() => {
  vi.clearAllMocks();
  h.getLoveSearchQuota.mockResolvedValue({ limit: 5, used: 2, remaining: 3, unlimited: false });
  h.getLoveProfileAnswers.mockResolvedValue(null);
});

describe('loveConversationSchema', () => {
  it('accepte 1 à 12 messages non vides et les nettoie', () => {
    expect(loveConversationSchema.parse({ messages: ['  salut  '] }).messages).toEqual(['salut']);
  });
  it('refuse une liste vide, trop longue ou un message vide', () => {
    expect(loveConversationSchema.safeParse({ messages: [] }).success).toBe(false);
    expect(loveConversationSchema.safeParse({ messages: Array(13).fill('a') }).success).toBe(false);
    expect(loveConversationSchema.safeParse({ messages: ['   '] }).success).toBe(false);
    expect(loveConversationSchema.safeParse({ messages: ['a'.repeat(1001)] }).success).toBe(false);
  });
});

describe('handleLoveConversation', () => {
  it('concatène les messages pour l’analyse', async () => {
    h.parseLoveQuery.mockResolvedValue({});
    await handleLoveConversation('u1', ['une femme', 'sérieuse']);
    expect(h.parseLoveQuery).toHaveBeenCalledWith('une femme\nsérieuse');
  });

  it.each([
    [{}, ['gender', 'age', 'goal'], 'une femme, un homme'],
    [{ genders: ['female'] }, ['age', 'goal'], 'tranche d’âge'],
    [{ genders: ['female'], ageMax: 40 }, ['goal'], 'sérieux, sans engagement'],
  ])('pose la question suivante quand il manque des critères (%j)', async (criteria, missing, replyPart) => {
    h.parseLoveQuery.mockResolvedValue(criteria);
    const out = await handleLoveConversation('u1', ['x']);
    expect(out.phase).toBe('clarifying');
    expect(out.missing).toEqual(missing);
    expect(out.reply).toContain(replyPart);
    expect(out.remainingSearches).toBe(3);
    expect(out.results).toBeUndefined();
    expect(h.searchLove).not.toHaveBeenCalled();
  });

  it('lance la recherche (et consomme le quota) quand les critères sont complets', async () => {
    const criteria = { genders: ['male'], ageMin: 30, relationshipGoal: 'serious' };
    h.parseLoveQuery.mockResolvedValue(criteria);
    h.searchLove.mockResolvedValue({ query: 'q', criteria, results: [{ id: 'c1' }], remainingSearches: 2 });
    const out = await handleLoveConversation('u1', ['un homme', 'sérieux', '30 ans']);
    expect(h.searchLove).toHaveBeenCalledWith('u1', 'un homme\nsérieux\n30 ans');
    expect(out).toMatchObject({ phase: 'results', missing: [], remainingSearches: 2, results: [{ id: 'c1' }], ignored: [] });
    expect(out.reply).toContain('sélection');
    expect(h.getLoveSearchQuota).not.toHaveBeenCalled();
  });

  it('le profil Love complète le but relationnel manquant et la distance', async () => {
    h.parseLoveQuery.mockResolvedValue({ genders: ['female'], ageMin: 25 });
    h.getLoveProfileAnswers.mockResolvedValue(profile);
    h.searchLove.mockResolvedValue({ results: [], remainingSearches: 1 });
    const out = await handleLoveConversation('u1', ['une femme de 25 ans']);
    expect(out.phase).toBe('results');
    expect(out.criteria).toMatchObject({ relationshipGoal: 'casual', distanceKm: 25, genders: ['female'] });
  });

  it('la demande actuelle prime sur le profil', async () => {
    h.parseLoveQuery.mockResolvedValue({ genders: ['male'], ageMin: 30, relationshipGoal: 'serious', distanceKm: 100 });
    h.getLoveProfileAnswers.mockResolvedValue(profile);
    h.searchLove.mockResolvedValue({ results: [], remainingSearches: 4 });
    const out = await handleLoveConversation('u1', ['x']);
    expect(out.criteria).toMatchObject({ relationshipGoal: 'serious', distanceKm: 100 });
  });

  it('signale les catégories sensibles ignorées dans la réponse', async () => {
    h.parseLoveQuery.mockResolvedValue({});
    const out = await handleLoveConversation('u1', ['quelqu’un de musulman']);
    expect(out.ignored).toEqual(['religion']);
    expect(out.reply).toContain('Je n’utilise pas de critères liés à : religion');
  });
});
