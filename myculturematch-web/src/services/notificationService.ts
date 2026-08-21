import notificationsMock from '@/src/mocks/notifications.json';
import type { NotificationItem } from '@/src/types/notification';
import { api, USE_MOCK } from './api';

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    if (USE_MOCK) {
      return notificationsMock as NotificationItem[];
    }
    return api.get<NotificationItem[]>('/api/notifications');
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
