import { useConnectionsStore } from '@/src/stores/useConnectionsStore';

export function useConnections() {
  const activeSubTab = useConnectionsStore((state) => state.activeSubTab);
  const suggestions = useConnectionsStore((state) => state.suggestions);
  const interested = useConnectionsStore((state) => state.interested);
  const demandes = useConnectionsStore((state) => state.demandes);
  const compagnons = useConnectionsStore((state) => state.compagnons);
  
  const setActiveSubTab = useConnectionsStore((state) => state.setActiveSubTab);
  const sendRequest = useConnectionsStore((state) => state.sendRequest);
  const acceptRequest = useConnectionsStore((state) => state.acceptRequest);
  const declineRequest = useConnectionsStore((state) => state.declineRequest);

  const getFilteredList = () => {
    switch (activeSubTab) {
      case 'Suggestions': return suggestions;
      case 'Interested': return interested;
      case 'Demandes': return demandes;
      case 'Compagnons': return compagnons;
      default: return [];
    }
  };

  return {
    activeSubTab,
    suggestionsCount: suggestions.length,
    interestedCount: interested.length,
    demandesCount: demandes.length,
    compagnonsCount: compagnons.length,
    currentList: getFilteredList(),
    setActiveSubTab,
    sendRequest,
    acceptRequest,
    declineRequest,
  };
}
