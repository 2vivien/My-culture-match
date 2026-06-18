import messagesMock from '@/src/mocks/messages.json';
import type { Message } from '@/src/types/message';

const USE_MOCK = true;
const API_BASE = '';

export const messagesService = {
  async getMessages(): Promise<Message[]> {
    if (USE_MOCK) {
      return messagesMock as Message[];
    }
    const res = await fetch(`${API_BASE}/api/messages`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json() as Promise<Message[]>;
  },

  async toggleNotifications(messageId: string): Promise<void> {
    if (USE_MOCK) {
      return;
    }
    await fetch(`${API_BASE}/api/messages/${messageId}/notifications`, { method: 'POST' });
  },
};
