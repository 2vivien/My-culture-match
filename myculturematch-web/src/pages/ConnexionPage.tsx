import React, { useState } from 'react';
import { ConnectionsTabs } from '@/src/components/connections/ConnectionsTabs';
import { UserCard } from '@/src/components/connections/UserCard';
import { UserRow } from '@/src/components/connections/UserRow';
import { RequestCard } from '@/src/components/connections/RequestCard';
import { RequestRow } from '@/src/components/connections/RequestRow';
import { CompanionCard } from '@/src/components/connections/CompanionCard';
import { CompanionRow } from '@/src/components/connections/CompanionRow';
import { useConnections } from '@/src/hooks/useConnections';
import { useUIStore } from '@/src/stores/useUIStore';
import { Search, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FunnelPlus = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    <path d="M19 14h4" />
    <path d="M21 12v4" />
  </svg>
);

export function ConnexionPage() {
  const { activeSubTab, currentList, sendRequest, acceptRequest, declineRequest } = useConnections();
  const { setActiveTab } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Handle message redirection to Thunderbird chat
  const handleMessage = (userId: string) => {
    setActiveTab('Thunderbird');
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
      <div className="flex gap-3 mb-6 shrink-0">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Rechercher dans ${activeSubTab === 'Suggestions' ? 'les suggestions' : activeSubTab === 'Interested' ? 'les visites' : activeSubTab === 'Demandes' ? 'les demandes' : 'les compagnons'}...`}
            className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-sm transition-colors placeholder:text-zinc-400"
          />
        </div>
        
        <button
          type="button"
          className="px-5 py-3.5 bg-zinc-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl flex items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer font-black text-xs transition-colors shrink-0"
        >
          <FunnelPlus className="w-3.5 h-3.5 text-[#E27D60]" />
          <span className="hidden sm:inline">Filtres</span>
        </button>
      </div>

      {/* Dynamic profile results list scrollable container */}
      <div className="flex-1 overflow-y-auto pr-1 pb-8 hide-scrollbar">
        <AnimatePresence mode="wait">
          {filteredList.length > 0 ? (
            <div key={activeSubTab + '-' + filteredList.length}>
              {activeSubTab === 'Suggestions' && (
                <>
                  {/* Desktop */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filteredList.map((user) => (
                      <UserCard key={user.id} user={user} onConnect={sendRequest} />
                    ))}
                  </motion.div>
                  {/* Mobile */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="md:hidden flex flex-col gap-3.5"
                  >
                    {filteredList.map((user) => (
                      <UserRow key={user.id} user={user} onConnect={sendRequest} />
                    ))}
                  </motion.div>
                </>
              )}

              {activeSubTab === 'Interested' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredList.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onConnect={sendRequest}
                      isInterested={true}
                    />
                  ))}
                </motion.div>
              )}

              {activeSubTab === 'Demandes' && (
                <>
                  {/* Desktop */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filteredList.map((user) => (
                      <RequestCard
                        key={user.id}
                        user={user}
                        onAccept={acceptRequest}
                        onDecline={declineRequest}
                      />
                    ))}
                  </motion.div>
                  {/* Mobile */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="md:hidden flex flex-col gap-3.5"
                  >
                    {filteredList.map((user) => (
                      <RequestRow
                        key={user.id}
                        user={user}
                        onAccept={acceptRequest}
                        onDecline={declineRequest}
                      />
                    ))}
                  </motion.div>
                </>
              )}

              {activeSubTab === 'Compagnons' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredList.map((user) => {
                    return (
                      <CompanionCard
                        key={user.id}
                        user={user}
                        onMessage={handleMessage}
                      />
                    );
                  })}
                </motion.div>
              )}
            </div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-850 text-zinc-400 mb-4">
                <UserX className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Aucun profil trouvé</h4>
              <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                {searchQuery 
                  ? `Aucun profil ne correspond à la recherche "${searchQuery}".` 
                  : `Cette section est vide pour l'instant.`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
