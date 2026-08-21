import notificationsMock from '@/src/mocks/notifications.json';
import type { NotificationItem } from '@/src/types/notification';
import { api, USE_MOCK } from './api';

/** Backend NotificationDto shape. */
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
    if (USE_MOCK) {
      return notificationsMock as NotificationItem[];
    }
    const data = await api.get<{ notifications: BackendNotification[]; nextCursor: string | null }>('/api/notifications');
    return (data.notifications ?? []).map(mapNotification);
  },

  async markAllAsRead(): Promise<void> {
    if (USE_MOCK) {
      return;
    }
    await api.post('/api/notifications/read-all');
  },

  async updateReadStatus(id: string, isUnread: boolean): Promise<void> {
    if (USE_MOCK) {
      return;
    }
    await api.patch(`/api/notifications/${id}`, { isUnread });
  },

  async handleInviteAction(id: string, action: 'accept' | 'decline'): Promise<void> {
    if (USE_MOCK) {
      return;
    }
    await api.post(`/api/notifications/${id}/${action}`);
  },
};
