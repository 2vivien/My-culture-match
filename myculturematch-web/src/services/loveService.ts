import type { LoveMatch, LoveSearchQuota, LoveSearchResponse, LoveSearchResult } from '@/src/types/love';
import { api } from './api';
import { resolveCountryFlag } from '@/src/components/ui/ProfileAvatar';
import { fallbackAvatar } from '@/src/lib/media';
import type { UserProfile } from '@/src/lib/compatibility/types';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

type LoveRequestPayload = { userId: string; name: string; avatar: string | null; bio: string | null; country: string | null; age: number | null; matchScore: number };

export const LOVE_REQUEST_PREFIX = 'love:';

function mapResult(c: any): LoveSearchResult {
  const country = (c.country as string) ?? '';
  return { id: c.id as string, name: (c.name as string) ?? 'Profil', age: (c.age as number) ?? 0, gender: (c.gender as LoveMatch['gender']) ?? 'female', country, flag: resolveCountryFlag(country) ?? '🌍', avatar: (c.avatar as string) || fallbackAvatar(c.name as string) || '', matchScore: (c.matchScore as number) ?? 0, online: Boolean(c.online ?? c.connected), interest: ((c.sharedValues as string[]) ?? []).join(', '), about: (c.bio as string) ?? '', tribes: (c.sharedValues as string[]) ?? [], languages: (c.languages as string[]) ?? [], rank: (c.rank as number) ?? 0, reasons: (c.reasons as string[]) ?? [], breakdown: (c.breakdown as LoveSearchResult['breakdown']) ?? { values: 0, goals: 0, language: 0, culture: 0, interests: 0 } };
}

export type LoveConversationResponse = { reply: string; phase: 'clarifying' | 'results'; criteria: Record<string, unknown>; missing: string[]; remainingSearches: number; results?: LoveSearchResult[] };

/** Réponses au questionnaire de première utilisation (vocabulaires définis côté serveur). */
export interface LoveProfileAnswers {
  goals: string[];
  relationship: string;
  values: string[];
  lifestyle: string[];
  distance: string;
  understood?: string;
}

export type LoveProfileResponse = { completed: boolean; answers: LoveProfileAnswers | null; ignoredCategories?: string[]; notice?: string };

export const loveService = {
  /** Questionnaire Love : `completed` est faux tant que la personne n'a pas répondu. */
  async getProfile(): Promise<LoveProfileResponse> { return api.get('/api/love/profile'); },
  async saveProfile(answers: LoveProfileAnswers): Promise<LoveProfileResponse> { return api.put('/api/love/profile', answers); },
  /** Requêtes Love reçues : l'autre personne doit accepter avant toute conversation. */
  async getRequests(): Promise<ConnectionUser[]> {
    const data = await api.get<{ requests: LoveRequestPayload[] }>('/api/love/requests');
    return (data.requests ?? []).map((r) => ({
      id: `${LOVE_REQUEST_PREFIX}${r.userId}`,
      name: r.name,
      avatar: r.avatar || fallbackAvatar(r.name) || '',
      matchScore: r.matchScore,
      country: r.country ?? '',
      countryFlag: resolveCountryFlag(r.country ?? '') ?? '🌍',
      countryCode: (r.country ?? '').slice(0, 2).toUpperCase(),
      interestedCount: 0,
      compagnonsCount: 0,
      interests: r.bio ? [r.bio] : [],
      age: r.age ?? undefined,
      mode: 'love' as const,
    }));
  },
  async acceptRequest(prefixedId: string): Promise<{ matched: boolean; conversationId?: string }> { return api.post(`/api/love/requests/${prefixedId.slice(LOVE_REQUEST_PREFIX.length)}/accept`); },
  async declineRequest(prefixedId: string): Promise<{ matched: false }> { return api.post(`/api/love/requests/${prefixedId.slice(LOVE_REQUEST_PREFIX.length)}/decline`); },
  async search(query: string): Promise<LoveSearchResponse> { const data = await api.post<LoveSearchResponse>('/api/love/search', { query }); return { ...data, results: (data.results ?? []).map(mapResult) }; },
  async conversation(messages: string[]): Promise<LoveConversationResponse> { const data = await api.post<LoveConversationResponse>('/api/love/conversation', { messages }); return { ...data, results: (data.results ?? []).map(mapResult) }; },
  async getSearchQuota(): Promise<LoveSearchQuota> { return api.get<LoveSearchQuota>('/api/love/search/quota'); },
  async expressInterest(candidateId: string): Promise<{ matched: boolean; conversationId?: string }> { return api.post<{ matched: boolean; conversationId?: string }>('/api/love/swipe', { userId: candidateId, action: 'like' }); },
  async fetchActiveMatches(): Promise<LoveMatch[]> { const list = await api.get<Array<Record<string, unknown>>>('/api/love/active'); return (list ?? []).map((c) => ({ id: c.id as string, name: c.name as string, age: (c.age as number) ?? 0, gender: (c.gender as LoveMatch['gender']) ?? 'female', country: (c.country as string) ?? '', flag: resolveCountryFlag((c.country as string) ?? '') ?? '🌍', avatar: (c.avatar as string) || fallbackAvatar(c.name as string) || '', matchScore: (c.matchScore as number) ?? 0, online: true, interest: '', about: (c.bio as string) ?? '', tribes: [], languages: [] })); },
  async fetchLoveMatches(_userProfile: UserProfile): Promise<LoveMatch[]> { const data = await api.get<{ candidates?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>('/api/love/matches'); const list = Array.isArray(data) ? data : (data?.candidates ?? []); return list.map((c) => ({ id: c.id as string, name: c.name as string, age: (c.age as number) ?? 0, gender: (c.gender as LoveMatch['gender']) ?? 'female', country: (c.country as string) ?? '', flag: resolveCountryFlag((c.country as string) ?? '') ?? '🌍', avatar: (c.avatar as string) || fallbackAvatar(c.name as string) || '', matchScore: (c.matchScore as number) ?? 0, online: Boolean((c as { connected?: boolean }).connected), interest: ((c.sharedValues as string[]) ?? []).join(', '), about: (c.bio as string) ?? '', tribes: (c.sharedValues as string[]) ?? [], languages: [] })); },
};
