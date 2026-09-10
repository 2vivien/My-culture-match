import settingsMock from '@/src/mocks/settings.json';
import type { UserSettings } from '@/src/types/settings';
import { api, USE_MOCK } from './api';

export const settingsService = {
  async getSettings(): Promise<UserSettings> {
    if (USE_MOCK) {
      return settingsMock as UserSettings;
    }
    return api.get<UserSettings>('/api/settings');
  },

  async updateSettings(data: Partial<UserSettings>): Promise<void> {
    if (USE_MOCK) {
      return;
    }
    await api.put('/api/settings', data);
  },

  async requestEmailChange(newEmail: string): Promise<EmailChangeRequestResult> {
    if (USE_MOCK) {
      return { sentTo: newEmail, expiresInSeconds: 300 };
    }
    return api.post<EmailChangeRequestResult>('/api/settings/email/request', { newEmail });
  },

  async confirmEmailChange(newEmail: string, code: string): Promise<UserSettings> {
    if (USE_MOCK) {
      return settingsMock as UserSettings;
    }
    return api.post<UserSettings>('/api/settings/email/change', { newEmail, code });
  },
};

export interface EmailChangeRequestResult {
  sentTo: string;
  expiresInSeconds: number;
}
