import React from 'react';
import { motion } from 'framer-motion';
import { UserCard } from '../UserCard';
import { UserRow } from '../UserRow';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

interface InterestedTabProps {
  list: ConnectionUser[];
  onConnect: (id: string) => void;
}

export const InterestedTab: React.FC<InterestedTabProps> = ({ list, onConnect }) => {
  return (
    <>
      {/* Desktop */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.25 }}
        className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {list.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onConnect={onConnect}
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
        {list.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            onConnect={onConnect}
            isInterested={true}
          />
        ))}
      </motion.div>
    </>
  );
};
