import messagesMock from '@/src/mocks/messages.json';
import type { Message } from '@/src/types/message';
import { api, USE_MOCK } from './api';

export const messagesService = {
  async getMessages(): Promise<Message[]> {
    if (USE_MOCK) {
      return messagesMock as Message[];
    }
    return api.get<Message[]>('/api/messages');
  },

  async toggleNotifications(messageId: string): Promise<void> {
    if (USE_MOCK) {
      return;
    }
    await api.post(`/api/messages/${messageId}/notifications`);
  },
};
