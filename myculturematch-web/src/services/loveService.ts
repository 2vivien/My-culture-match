import type { LoveMatch } from '@/src/types/love';
import { api } from './api';
import { resolveCountryFlag } from '@/src/components/ui/TotemAvatar';
import { fallbackAvatar } from '@/src/lib/media';
import type { UserProfile } from '@/src/lib/compatibility/types';

export const loveService = {
  /** POST /api/love/swipe — like réel ("I'm Interested") pour un candidat. */
  async expressInterest(candidateId: string): Promise<{ matched: boolean; conversationId?: string }> {
    return api.post<{ matched: boolean; conversationId?: string }>('/api/love/swipe', {
      userId: candidateId,
      action: 'like',
    });
  },

  /** GET /api/love/active — matchs actifs (likes réciproques acceptés). */
  async fetchActiveMatches(): Promise<LoveMatch[]> {
    const list = await api.get<Array<Record<string, unknown>>>('/api/love/active');
    return (list ?? []).map((c) => {
      const country = (c.country as string) ?? '';
      return {
        id: c.id as string,
        name: c.name as string,
        age: (c.age as number) ?? 0,
        gender: (c.gender as LoveMatch['gender']) ?? 'female',
        country,
        flag: resolveCountryFlag(country) ?? '🌍',
        avatar: (c.avatar as string) || fallbackAvatar(c.name as string) || '',
        matchScore: (c.matchScore as number) ?? 0,
        online: true, // actif = like réciproque accepté → discussion ouverte
        interest: '',
        about: (c.bio as string) ?? '',
        tribes: [],
        languages: [],
      };
    });
  },

  async fetchLoveMatches(_userProfile: UserProfile): Promise<LoveMatch[]> {
    // Le backend renvoie { candidates: [...] } — on déballe la liste.
    const data = await api.get<{ candidates?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>('/api/love/matches');
    const list = Array.isArray(data) ? data : (data?.candidates ?? []);
    return (list ?? []).map((c) => {
      const country = (c.country as string) ?? '';
      return {
        id: c.id as string,
        name: c.name as string,
        age: (c.age as number) ?? 0,
        gender: (c.gender as LoveMatch['gender']) ?? 'female',
        country,
        // Vrai drapeau du pays d'origine (plus le mock 🌍)
        flag: resolveCountryFlag(country) ?? '🌍',
        avatar: (c.avatar as string) || fallbackAvatar(c.name as string) || '',
        matchScore: (c.matchScore as number) ?? 0,
        // Les matchs "actifs" sont les connections acceptées (companions).
        online: Boolean((c as { connected?: boolean }).connected),
        interest: ((c.sharedValues as string[]) ?? []).join(', '),
        about: (c.bio as string) ?? '',
        tribes: (c.sharedValues as string[]) ?? [],
        languages: [],
      };
    });
  },
};
