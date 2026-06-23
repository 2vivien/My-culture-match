import settingsMock from '@/src/mocks/settings.json';
import type { UserSettings } from '@/src/types/settings';

export const settingsService = {
  async getSettings(): Promise<UserSettings> {
    return settingsMock as UserSettings;
  },

  async updateSettings(data: Partial<UserSettings>): Promise<void> {
    // In a real application, this would send an API request to the backend.
    console.log('Settings updated:', data);
    return new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }
};
