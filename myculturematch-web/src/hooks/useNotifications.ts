import { useState, useEffect } from 'react';
import { notificationService } from '@/src/services/notificationService';
import type { NotificationItem } from '@/src/types/notification';
import { useUIStore } from '@/src/stores/useUIStore';

export function useNotifications() {
  const { setNotificationsCount } = useUIStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    notificationService.getNotifications().then((data) => {
      if (isMounted) {
        setNotifications(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync unread count to global UI store dynamically on change
  useEffect(() => {
    const unreadCount = notifications.filter((n) => n.isUnread).length;
    setNotificationsCount(unreadCount);
  }, [notifications, setNotificationsCount]);

  const displayedNotifications = notifications.filter((n) =>
    filter === 'unread' ? n.isUnread : true
  );

  const handleAction = async (id: string, actionName: 'accept' | 'decline') => {
    try {
      await notificationService.handleInviteAction(id, actionName);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error executing invite action:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const toggleReadState = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    if (!target) return;
    const nextStatus = !target.isUnread;

    try {
      await notificationService.updateReadStatus(id, nextStatus);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isUnread: nextStatus } : n))
      );
    } catch (err) {
      console.error('Error updating notification read state:', err);
    }
  };

  return {
    filter,
    setFilter,
    displayedNotifications,
    handleAction,
    markAllRead,
    toggleReadState,
  };
}
