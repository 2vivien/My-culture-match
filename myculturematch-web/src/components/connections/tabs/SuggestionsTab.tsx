import React from 'react';
import { motion } from 'framer-motion';
import { UserCard } from '../UserCard';
import { UserRow } from '../UserRow';
import { FriendsProximityMap } from '../FriendsProximityMap';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

/**
 * Positions de démo (comme Snap Map) : les amis sans coordonnées réelles
 * sont répartis autour de Cotonou pour la démo de la carte.
 * À remplacer par les vraies coordonnées quand le backend les expose.
 */
const DEMO_COORDS: Array<{ lat: number; lon: number }> = [
  { lat: 6.3703, lon: 2.3912 }, // Cotonou
  { lat: 6.365, lon: 2.418 }, // Cotonou est
  { lat: 6.355, lon: 2.375 }, // Cotonou ouest
  { lat: 14.716, lon: -17.467 }, // Dakar
  { lat: 4.051, lon: 9.767 }, // Douala
  { lat: 5.359, lon: -4.008 }, // Abidjan
  { lat: 9.307, lon: 2.315 }, // Porto-Novo
  { lat: 6.131, lon: 1.222 }, // Lomé
];

interface SuggestionsTabProps {
  list: ConnectionUser[];
  onConnect: (id: string) => void;
}

export const SuggestionsTab: React.FC<SuggestionsTabProps> = ({ list, onConnect }) => {
  // Coordonnées : fallback démo réparti autour de la carte (Snap Map style)
  const usersWithCoords = list.map((u, i) => ({
    ...u,
    lat: DEMO_COORDS[i % DEMO_COORDS.length].lat + (i % 3) * 0.01,
    lon: DEMO_COORDS[i % DEMO_COORDS.length].lon + (i % 2) * 0.008,
  }));

  return (
    <>
      {/* Carte Friends Proximity (Snap Map-like) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.25 }}
        className="mb-6"
      >
        <FriendsProximityMap users={usersWithCoords} />
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
