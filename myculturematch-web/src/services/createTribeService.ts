import { launchThemes, themeIcons } from '@/src/lib/themes';
import type { TribeTopic, TribeSubmission } from '@/src/types/createTribe';

export const createTribeService = {
  async getTopics(): Promise<TribeTopic[]> {
    return launchThemes.map((name) => ({
      name,
      icon: themeIcons[name] || '🏷️',
    }));
  },

  async submitTribe(data: TribeSubmission): Promise<{ success: boolean }> {
    // Simulated API call to the backend
    console.log('Tribu created:', data);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  }
};
