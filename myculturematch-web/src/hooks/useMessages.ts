import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesService } from '@/src/services/messagesService';
import type { Message } from '@/src/types/message';

export function useMessages() {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, error } = useQuery<Message[]>({
    queryKey: ['messages'],
    queryFn: messagesService.getMessages,
    staleTime: 1000 * 60 * 3,
  });

  const toggleNotifications = useMutation({
    mutationFn: messagesService.toggleNotifications,
    onMutate: async (msgId) => {
      await queryClient.cancelQueries({ queryKey: ['messages'] });
      const prevMsgs = queryClient.getQueryData<Message[]>(['messages']);
      if (prevMsgs) {
        queryClient.setQueryData<Message[]>(
          ['messages'],
          prevMsgs.map((m) =>
            m.id === msgId ? { ...m, notificationsOn: !m.notificationsOn } : m
          )
        );
      }
      return { prevMsgs };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prevMsgs) {
        queryClient.setQueryData(['messages'], ctx.prevMsgs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  return {
    messages,
    isLoading,
    error,
    toggleNotifications: toggleNotifications.mutate,
  };
}
