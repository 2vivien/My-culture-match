import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionsService } from '@/src/services/connectionsService';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

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
    mutationFn: connectionsService.acceptRequest,
    onSuccess: invalidateAll,
  });

  const declineRequest = useMutation({
    mutationFn: connectionsService.declineRequest,
    onSuccess: invalidateAll,
  });

  const blockRequest = useMutation({
    mutationFn: connectionsService.blockRequest,
    onSuccess: invalidateAll,
  });

  return {
    suggestions: suggestions.data ?? [],
    interested: interested.data ?? [],
    requests: requests.data ?? [],
    companions: companions.data ?? [],
    isLoading: suggestions.isLoading || interested.isLoading || requests.isLoading || companions.isLoading,
    sendRequest: sendRequest.mutate,
    acceptRequest: acceptRequest.mutate,
    declineRequest: declineRequest.mutate,
    blockRequest: blockRequest.mutate,
  };
}
