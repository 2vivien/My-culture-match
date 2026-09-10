import type { Message } from '@/src/types/message';
import { api } from './api';

interface BackendConversation {
  id: string;
  name?: string;
  avatar?: string;
  culture?: string;
  isGroup?: boolean;
  lastMessage?: string;
  unreadCount?: number;
  notificationsEnabled?: boolean;
  participants?: { userId: string; user?: { name: string; avatar: string | null } }[];
}

export const messagesService = {
  async getMessages(): Promise<Message[]> {
    const data = await api.get<BackendConversation[] | { messages: BackendConversation[] }>('/api/messages');
    const convos = Array.isArray(data) ? data : (data.messages ?? []);
    return convos.map((c) => ({
      id: c.id,
      name: c.name ?? 'Conversation',
      role: c.culture ?? '',
      img: c.avatar ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${c.id}`,
      notificationsOn: c.notificationsEnabled ?? true,
      lastMessage: c.lastMessage ?? '',
    }));
  },

  async toggleNotifications(messageId: string): Promise<void> {
    await api.post(`/api/messages/${messageId}/notifications`);
  },
};
