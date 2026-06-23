import React from 'react';
import { motion } from 'framer-motion';
import { CompanionCard } from '../CompanionCard';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

interface CompagnonsTabProps {
  list: ConnectionUser[];
  onMessage: (id: string) => void;
}

export const CompagnonsTab: React.FC<CompagnonsTabProps> = ({ list, onMessage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {list.map((user) => (
        <CompanionCard
          key={user.id}
          user={user}
          onMessage={onMessage}
        />
      ))}
    </motion.div>
  );
};
