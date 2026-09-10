import type { LoveMatch } from '@/src/types/love';
import { api } from './api';
import type { UserProfile } from '@/src/lib/compatibility/types';

export const loveService = {
  async fetchLoveMatches(_userProfile: UserProfile): Promise<LoveMatch[]> {
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
