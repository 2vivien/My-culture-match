import React from 'react';
import { motion } from 'framer-motion';
import { UserCard } from '../connections/UserCard';
import { UserRow } from '../connections/UserRow';
import type { CompanionItem } from '@/src/types/explore';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

interface ExploreConnectionsTabProps {
  filteredCompanions: CompanionItem[];
  toggleConnectCompanion: (id: string) => void;
}

export const ExploreConnectionsTab: React.FC<ExploreConnectionsTabProps> = ({
  filteredCompanions,
  toggleConnectCompanion,
}) => {
  const mapCompanionToUser = (comp: CompanionItem): ConnectionUser => ({
    id: comp.id,
    name: comp.name,
    avatar: comp.avatar,
    matchScore: comp.matchScore,
    country: 'Japan',
    countryFlag: '🇯🇵',
    countryCode: comp.name === 'Keisuke' ? 'JP' : comp.name === 'Jumana' ? 'JO' : comp.name === 'Kaelen' ? 'NO' : 'BJ',
    interestedCount: 125,
    compagnonsCount: 48,
    interests: comp.interests,
    isConnected: comp.connected,
  });

  return (
    <motion.div
      key="companion-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      {/* Desktop View (Grid Cards) */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredCompanions.map((comp) => (
          <UserCard
            key={comp.id}
            user={mapCompanionToUser(comp)}
            onConnect={() => toggleConnectCompanion(comp.id)}
          />
        ))}
      </div>

      {/* Mobile View (List Rows) */}
      <div className="flex md:hidden flex-col gap-3.5">
        {filteredCompanions.map((comp) => (
          <UserRow
            key={comp.id}
            user={mapCompanionToUser(comp)}
            onConnect={() => toggleConnectCompanion(comp.id)}
          />
        ))}
      </div>
    </motion.div>
  );
};
