import type { NotificationItem } from '@/src/types/notification';
import { api } from './api';

interface BackendNotification {
  id: string;
  type: string;
  action: string | null;
  target: string | null;
  time: string;
  isUnread: boolean;
  user: { id: string; name: string; avatar: string | null; label: string; subText?: string };
}

function mapNotification(n: BackendNotification): NotificationItem {
  return {
    id: n.id,
    user: {
      name: n.user.name,
      avatar: n.user.avatar ?? '',
      action: n.user.label,
      target: n.target ?? '',
      subText: n.user.subText,
    },
    type: n.type as NotificationItem['type'],
    time: n.time,
    isUnread: n.isUnread,
  };
}

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    const data = await api.get<{ notifications: BackendNotification[]; nextCursor: string | null } | BackendNotification[]>('/api/notifications');
    const raw = Array.isArray(data) ? data : (data.notifications ?? []);
    return raw.map(mapNotification);
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/api/notifications/read-all');
  },

  async updateReadStatus(id: string, isUnread: boolean): Promise<void> {
    await api.patch(`/api/notifications/${id}`, { isUnread });
  },

  async handleInviteAction(id: string, action: 'accept' | 'decline'): Promise<void> {
    await api.post(`/api/notifications/${id}/${action}`);
  },
};
