import loveMock from '@/src/mocks/love.json';
import type { LoveMatch } from '@/src/types/love';
import { enrichLoveMatches } from '@/src/lib/compatibility/compatibilityEngine';
import type { UserProfile } from '@/src/lib/compatibility/types';
import { api, USE_MOCK } from './api';

const rawMatches = loveMock as unknown as (LoveMatch & { tribes?: string[]; languages?: string[] })[];

export const loveService = {
  /**
   * Enrichit les matches mock avec un score de compatibilité calculé côté client.
   * @param userProfile — profil de l'utilisateur courant (fourni par le hook appelant).
   */
  getLoveMatches(userProfile: UserProfile): LoveMatch[] {
    const enriched = enrichLoveMatches(userProfile, rawMatches);

    return enriched
      .map((m) => ({
        id: m.id,
        name: m.name,
        age: m.age,
        gender: m.gender as 'female' | 'male' | 'non-binary',
        country: m.country,
        flag: m.flag,
        avatar: m.avatar,
        matchScore: m.overall,
        online: m.online,
        interest: m.interest,
        about: m.about,
        tribes: m.tribes || [],
        languages: m.languages || [],
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  },

  async fetchLoveMatches(userProfile: UserProfile): Promise<LoveMatch[]> {
    if (USE_MOCK) {
      return this.getLoveMatches(userProfile);
    }
    const data = await api.get<Array<Record<string, unknown>>>('/api/love/matches');
    return (data ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      age: (c.age as number) ?? 0,
      gender: 'female' as const,
      country: (c.country as string) ?? '',
      flag: '🌍',
      avatar: (c.avatar as string) ?? `https://api.dicebear.com/7.x/open-peeps/svg?seed=${c.id}`,
      matchScore: (c.matchScore as number) ?? 0,
      online: false,
      interest: ((c.sharedValues as string[]) ?? []).join(', '),
      about: (c.bio as string) ?? '',
      tribes: (c.sharedValues as string[]) ?? [],
      languages: [],
    }));
  },
};
