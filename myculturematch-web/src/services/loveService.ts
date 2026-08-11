import loveMock from '@/src/mocks/love.json';
import type { LoveMatch } from '@/src/types/love';
import { api, USE_MOCK } from './api';

const mockLoveMatches = loveMock as LoveMatch[];

export const loveService = {
  getLoveMatches(): LoveMatch[] {
    return mockLoveMatches;
  },

  async fetchLoveMatches(): Promise<LoveMatch[]> {
    if (USE_MOCK) {
      return mockLoveMatches;
    }
    return api.get<LoveMatch[]>('/api/love/matches');
  },
};
