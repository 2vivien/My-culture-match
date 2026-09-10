import { launchThemes, themeIcons } from '@/src/lib/themes';
import type { TribeTopic, TribeSubmission } from '@/src/types/createTribe';
import { api } from './api';

export const createTribeService = {
  async getTopics(): Promise<TribeTopic[]> {
    return launchThemes.map((name) => ({
      name,
      icon: themeIcons[name] || '🏷️',
    }));
  },

  async submitTribe(data: TribeSubmission): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/api/tribes', data);
  },
};
