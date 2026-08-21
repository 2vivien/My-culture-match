import loveMock from '@/src/mocks/love.json';
import type { LoveMatch } from '@/src/types/love';
import { enrichLoveMatches } from '@/src/lib/compatibility/compatibilityEngine';
import type { UserProfile } from '@/src/lib/compatibility/types';
import { useAppStore } from '@/src/stores/useAppStore';
import { api, USE_MOCK } from './api';

const rawMatches = loveMock as unknown as (LoveMatch & { tribes?: string[]; languages?: string[] })[];

export const loveService = {
  getLoveMatches(): LoveMatch[] {
    const currentUser = useAppStore.getState().currentUser;

    const userProfile: UserProfile = {
      id: currentUser.id,
      name: currentUser.name,
      age: 25,
      gender: 'female',
      country: currentUser.location,
      location: currentUser.location,
      tribes: currentUser.tribes,
      interests: currentUser.tribes,
      languages: ['English', 'French'],
    };

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

  async fetchLoveMatches(): Promise<LoveMatch[]> {
    if (USE_MOCK) {
      return this.getLoveMatches();
    }
    return api.get<LoveMatch[]>('/api/love/matches');
  },
};
