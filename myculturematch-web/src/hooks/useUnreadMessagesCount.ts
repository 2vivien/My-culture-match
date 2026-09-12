import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/services/api';

/**
 * Nombre total de messages non lus (toutes conversations confondues).
 * Sert au badge temps réel de l'icône Messages (header + sidebar).
 */
export function useUnreadMessagesCount() {
  return useQuery<number>({
    queryKey: ['messages', 'unread-count'],
    queryFn: async () => {
      const data = await api.get<{ unreadCount: number }>('/api/messages/unread-count');
      return data.unreadCount ?? 0;
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}
