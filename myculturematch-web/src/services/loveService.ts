import loveMock from '@/src/mocks/love.json';
import type { LoveMatch } from '@/src/types/love';

const mockLoveMatches = loveMock as LoveMatch[];

export const loveService = {
  getLoveMatches(): LoveMatch[] {
    return mockLoveMatches;
  },
};
