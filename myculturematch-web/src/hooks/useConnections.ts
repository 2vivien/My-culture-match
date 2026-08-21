import { useMemo } from 'react';
import { useConnectionsStore } from '@/src/stores/useConnectionsStore';
import { useConnectionsData } from './useConnectionsData';

export function useConnections() {
  const activeSubTab = useConnectionsStore((state) => state.activeSubTab);
  const setActiveSubTab = useConnectionsStore((state) => state.setActiveSubTab);

  // Utilise les données du backend (React Query) quand USE_MOCK=false
  const {
    suggestions,
    interested,
    requests,
    companions,
    sendRequest: apiSendRequest,
    acceptRequest: apiAcceptRequest,
    declineRequest: apiDeclineRequest,
  } = useConnectionsData();

  const currentList = useMemo(() => {
    switch (activeSubTab) {
      case 'Suggestions': return suggestions;
      case 'Interested': return interested;
      case 'Demandes': return requests;
      case 'Compagnons': return companions;
      default: return [];
    }
  }, [activeSubTab, suggestions, interested, requests, companions]);

  return {
    activeSubTab,
    suggestionsCount: suggestions.length,
    interestedCount: interested.length,
    demandesCount: requests.length,
    compagnonsCount: companions.length,
    currentList,
    setActiveSubTab,
    sendRequest: apiSendRequest,
    acceptRequest: apiAcceptRequest,
    declineRequest: apiDeclineRequest,
  };
}
