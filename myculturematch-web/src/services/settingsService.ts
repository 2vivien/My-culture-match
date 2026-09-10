import type { UserSettings } from '@/src/types/settings';
import { api } from './api';

export const settingsService = {
  async getSettings(): Promise<UserSettings> {
    return api.get<UserSettings>('/api/settings');
  },

  async updateSettings(data: Partial<UserSettings>): Promise<void> {
    await api.put('/api/settings', data);
  },

  async requestEmailChange(newEmail: string): Promise<EmailChangeRequestResult> {
    return api.post<EmailChangeRequestResult>('/api/settings/email/request', { newEmail });
  },

  async confirmEmailChange(newEmail: string, code: string): Promise<UserSettings> {
    return api.post<UserSettings>('/api/settings/email/change', { newEmail, code });
  },
};

export interface EmailChangeRequestResult {
  sentTo: string;
  expiresInSeconds: number;
}
