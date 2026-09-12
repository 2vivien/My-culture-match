import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/src/services/notificationService';
import type { NotificationItem } from '@/src/types/notification';
import { useUIStore } from '@/src/stores/useUIStore';

export function useNotifications() {
  const setNotificationsCount = useUIStore((s) => s.setNotificationsCount);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
    staleTime: 1000 * 60 * 2,
  });

  // Sync unread count to global UI store — uniquement si la valeur change,
  // sinon zustand persist re-déclenche les abonnés et boucle infiniment.
  const unreadCount = notifications.filter((n) => n.isUnread).length;
  useEffect(() => {
    setNotificationsCount((prev: number) => {
      if (prev === unreadCount) return prev;
      return unreadCount;
    });
  }, [unreadCount, setNotificationsCount]);

  const displayedNotifications = notifications.filter((n) =>
    filter === 'unread' ? n.isUnread : true
  );

  const handleAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'decline' }) =>
      notificationService.handleInviteAction(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const toggleReadState = useMutation({
    mutationFn: ({ id, isUnread }: { id: string; isUnread: boolean }) =>
      notificationService.updateReadStatus(id, isUnread),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    filter,
    setFilter,
    displayedNotifications,
    isLoading,
    error,
    handleAction: (id: string, action: 'accept' | 'decline') =>
      handleAction.mutate({ id, action }),
    markAllRead: () => markAllRead.mutate(),
    toggleReadState: (id: string) => {
      const target = notifications.find((n) => n.id === id);
      if (target) {
        toggleReadState.mutate({ id, isUnread: !target.isUnread });
      }
    },
  };
}
