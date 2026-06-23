import notificationsMock from '@/src/mocks/notifications.json';
import type { NotificationItem } from '@/src/types/notification';

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    return notificationsMock as NotificationItem[];
  },

  async markAllAsRead(): Promise<void> {
    // Simulated API call
    return new Promise((resolve) => setTimeout(resolve, 100));
  },

  async updateReadStatus(id: string, isUnread: boolean): Promise<void> {
    // Simulated API call
    console.log(`Notification ${id} read status updated to:`, isUnread);
    return new Promise((resolve) => setTimeout(resolve, 50));
  },

  async handleInviteAction(id: string, action: 'accept' | 'decline'): Promise<void> {
    // Simulated API call
    console.log(`Invitation in notification ${id} action performed:`, action);
    return new Promise((resolve) => setTimeout(resolve, 100));
  }
};
