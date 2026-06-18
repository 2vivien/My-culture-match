import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsService } from '@/src/services/requestsService';
import type { RequestItem } from '@/src/types/request';

export function useRequests() {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading, error } = useQuery<RequestItem[]>({
    queryKey: ['requests'],
    queryFn: requestsService.getRequests,
    staleTime: 1000 * 60 * 5,
  });

  const handleRequest = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'block' | 'okay' }) =>
      requestsService.handleRequest(id, action),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['requests'] });
      const prev = queryClient.getQueryData<RequestItem[]>(['requests']);
      if (prev) {
        queryClient.setQueryData<RequestItem[]>(
          ['requests'],
          prev.filter((r) => r.id !== id)
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['requests'], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });

  return {
    requests,
    isLoading,
    error,
    respondToRequest: handleRequest.mutate,
  };
}
