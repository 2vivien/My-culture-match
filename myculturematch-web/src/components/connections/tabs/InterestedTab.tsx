import React from 'react';
import { motion } from 'framer-motion';
import { UserCard } from '../UserCard';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

interface InterestedTabProps {
  list: ConnectionUser[];
  onConnect: (id: string) => void;
}

export const InterestedTab: React.FC<InterestedTabProps> = ({ list, onConnect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {list.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onConnect={onConnect}
          isInterested={true}
        />
      ))}
    </motion.div>
  );
};
