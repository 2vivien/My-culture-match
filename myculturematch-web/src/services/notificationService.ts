import type { NotificationItem } from '@/src/types/notification';
import { api } from './api';

interface BackendNotification {
  id: string;
  type: string;
  action: string | null;
  target: string | null;
  time: string;
  isUnread: boolean;
  user: { id: string; name: string; username?: string; avatar: string | null; label: string; subText?: string };
}

/** Textes d'action en anglais selon le type de notification. */
const ACTION_LABEL_EN: Record<string, string> = {
  comment: 'commented on your post',
  like: 'liked your post',
  invite: 'sent you a friend request',
  request: 'sent you a friend request',
  match: 'is interested in you',
  message: 'sent you a message',
  system: 'system',
};

function mapNotification(n: BackendNotification): NotificationItem {
  return {
    id: n.id,
    user: {
      name: n.user.name,
      username: n.user.username ?? '',
      avatar: n.user.avatar ?? '',
      action: ACTION_LABEL_EN[n.type] ?? n.user.label,
      // Jamais d'IDs/hashes techniques dans l'affichage (ex: md5 hex).
      target: '',
      subText: undefined,
    },
    type: n.type as NotificationItem['type'],
    time: timeAgo(n.time),
    isUnread: n.isUnread,
  };
}

/** Convertit une date ISO en temps relatif court ("5 min", "3 h", "2 j"). */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMin = Math.floor((Date.now() - then) / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffJ = Math.floor(diffH / 24);
  if (diffJ < 7) return `${diffJ}d`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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
