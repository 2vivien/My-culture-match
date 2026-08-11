import { launchThemes, themeIcons } from '@/src/lib/themes';
import type { TribeTopic, TribeSubmission } from '@/src/types/createTribe';
import { api, USE_MOCK } from './api';

export const createTribeService = {
  async getTopics(): Promise<TribeTopic[]> {
    return launchThemes.map((name) => ({
      name,
      icon: themeIcons[name] || '🏷️',
    }));
  },

  async submitTribe(data: TribeSubmission): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 500);
      });
    }
    return api.post<{ success: boolean }>('/api/tribes', data);
  },
};
