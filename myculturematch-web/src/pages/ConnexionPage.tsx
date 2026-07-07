import React, { useState } from 'react';
import { ConnectionsTabs } from '@/src/components/connections/ConnectionsTabs';
import { ConnectionsSearch } from '@/src/components/connections/ConnectionsSearch';
import { SuggestionsTab } from '@/src/components/connections/tabs/SuggestionsTab';
import { InterestedTab } from '@/src/components/connections/tabs/InterestedTab';
import { DemandesTab } from '@/src/components/connections/tabs/DemandesTab';
import { CompagnonsTab } from '@/src/components/connections/tabs/CompagnonsTab';
import { ConnectionsEmptyState } from '@/src/components/connections/tabs/ConnectionsEmptyState';
import { useConnections } from '@/src/hooks/useConnections';
import { useUIStore } from '@/src/stores/useUIStore';
import { AnimatePresence } from 'framer-motion';

export function ConnexionPage() {
  const { activeSubTab, currentList, sendRequest, acceptRequest, declineRequest } = useConnections();
  const { setActiveTab } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Handle message redirection to Sandbox chat
  const handleMessage = (userId: string) => {
    setActiveTab('Sandbox');
  };

  // Filter current sub-tab list by search query (case-insensitive name check)
  const filteredList = currentList.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none px-1">
      {/* Horizontal connections sub-tabs bar */}
      <div className="shrink-0 mb-6">
        <ConnectionsTabs />
      </div>

      {/* Search Input and Filters trigger side-by-side */}
      <ConnectionsSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeSubTab={activeSubTab}
      />

      {/* Dynamic profile results list scrollable container */}
      <div className="flex-1 overflow-y-auto pr-1 pb-8 hide-scrollbar">
        <AnimatePresence mode="wait">
          {filteredList.length > 0 ? (
            <div key={activeSubTab + '-' + filteredList.length}>
              {activeSubTab === 'Suggestions' && (
                <SuggestionsTab list={filteredList} onConnect={sendRequest} />
              )}

              {activeSubTab === 'Interested' && (
                <InterestedTab list={filteredList} onConnect={sendRequest} />
              )}

              {activeSubTab === 'Demandes' && (
                <DemandesTab
                  list={filteredList}
                  onAccept={acceptRequest}
                  onDecline={declineRequest}
                />
              )}

              {activeSubTab === 'Compagnons' && (
                <CompagnonsTab list={filteredList} onMessage={handleMessage} />
              )}
            </div>
          ) : (
            <ConnectionsEmptyState
              searchQuery={searchQuery}
              activeSubTab={activeSubTab}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
