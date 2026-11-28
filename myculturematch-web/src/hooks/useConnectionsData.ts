import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionsService } from '@/src/services/connectionsService';
import { loveService, LOVE_REQUEST_PREFIX } from '@/src/services/loveService';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

const isLoveId = (id: string) => id.startsWith(LOVE_REQUEST_PREFIX);

/**
 * Hook React Query pour les connexions.
 */
export function useConnectionsData() {
  const queryClient = useQueryClient();

  const suggestions = useQuery<ConnectionUser[]>({
    queryKey: ['connections', 'suggestions'],
    queryFn: connectionsService.getSuggestions,
    staleTime: 1000 * 60 * 5,
  });

  const interested = useQuery<ConnectionUser[]>({
    queryKey: ['connections', 'interested'],
    queryFn: connectionsService.getInterested,
    staleTime: 1000 * 60 * 5,
  });

  const requests = useQuery<ConnectionUser[]>({
    queryKey: ['connections', 'requests'],
    queryFn: connectionsService.getRequests,
    staleTime: 1000 * 60 * 3,
  });

  // Requêtes Love (mode distinct de Friend, jamais fusionnées côté serveur)
  const loveRequests = useQuery<ConnectionUser[]>({
    queryKey: ['connections', 'love-requests'],
    queryFn: loveService.getRequests,
    staleTime: 1000 * 60 * 3,
  });

  const companions = useQuery<ConnectionUser[]>({
    queryKey: ['connections', 'companions'],
    queryFn: connectionsService.getCompanions,
    staleTime: 1000 * 60 * 3,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['connections'] });
  };

  const sendRequest = useMutation({
    mutationFn: connectionsService.sendRequest,
    onSuccess: invalidateAll,
  });

  const acceptRequest = useMutation({
    mutationFn: async (id: string): Promise<void> => { if (isLoveId(id)) await loveService.acceptRequest(id); else await connectionsService.acceptRequest(id); },
    onSuccess: invalidateAll,
  });

  const declineRequest = useMutation({
    mutationFn: async (id: string): Promise<void> => { if (isLoveId(id)) await loveService.declineRequest(id); else await connectionsService.declineRequest(id); },
    onSuccess: invalidateAll,
  });

  const blockRequest = useMutation({
    mutationFn: connectionsService.blockRequest,
    onSuccess: invalidateAll,
  });

  return {
    suggestions: suggestions.data ?? [],
    interested: interested.data ?? [],
    requests: [...(loveRequests.data ?? []), ...(requests.data ?? [])],
    companions: companions.data ?? [],
    isLoading: suggestions.isLoading || interested.isLoading || requests.isLoading || loveRequests.isLoading || companions.isLoading,
    sendRequest: sendRequest.mutate,
    acceptRequest: acceptRequest.mutate,
    declineRequest: declineRequest.mutate,
    blockRequest: blockRequest.mutate,
  };
}
