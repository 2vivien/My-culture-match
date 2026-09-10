import type { TribeOption, TraditionSubmission } from '@/src/types/createTradition';
import { api } from './api';

export const traditionService = {
  async getTribes(): Promise<TribeOption[]> {
    return api.get<TribeOption[]>('/api/tribes');
  },

  async submitTradition(data: TraditionSubmission): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/api/posts', data);
  },
};
