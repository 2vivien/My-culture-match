import React from 'react';
import { motion } from 'framer-motion';
import { UserCard } from '../UserCard';
import { UserRow } from '../UserRow';
import { FriendsProximityMap } from '../FriendsProximityMap';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

interface SuggestionsTabProps {
  list: ConnectionUser[];
  onConnect: (id: string) => void;
}

/**
 * Friends Proximity — la carte est la pièce centrale (style Snap Map) :
 *  - vrais utilisateurs de la DB avec partage de localisation activé ;
 *  - clusters, distance, recherche, ghost mode (voir FriendsProximityMap) ;
 *  - liste de profils en dessous.
 */
export const SuggestionsTab: React.FC<SuggestionsTabProps> = ({ list, onConnect }) => {
  return (
    <>
      {/* Carte Friends Proximity (Snap Map-like) — données réelles DB */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.25 }}
        className="mb-6"
      >
        <FriendsProximityMap />
      </motion.div>

      {/* Desktop list */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.25 }}
        className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {list.map((user) => (
          <UserCard key={user.id} user={user} onConnect={onConnect} />
        ))}
      </motion.div>
      {/* Mobile list */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.25 }}
        className="md:hidden flex flex-col gap-3.5"
      >
        {list.map((user) => (
          <UserRow key={user.id} user={user} onConnect={onConnect} />
        ))}
      </motion.div>
    </>
  );
};
