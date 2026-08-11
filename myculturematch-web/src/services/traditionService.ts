import createTraditionMock from '@/src/mocks/createTradition.json';
import type { TribeOption, TraditionSubmission } from '@/src/types/createTradition';
import { api, USE_MOCK } from './api';

export const traditionService = {
  async getTribes(): Promise<TribeOption[]> {
    if (USE_MOCK) {
      return createTraditionMock.tribes as TribeOption[];
    }
    return api.get<TribeOption[]>('/api/tribes');
  },

  async submitTradition(data: TraditionSubmission): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 500);
      });
    }
    return api.post<{ success: boolean }>('/api/posts', data);
  },
};
