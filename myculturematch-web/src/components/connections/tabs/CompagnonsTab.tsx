import React from 'react';
import { motion } from 'framer-motion';
import { CompanionCard } from '../CompanionCard';
import { CompanionRow } from '../CompanionRow';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

interface CompagnonsTabProps {
  list: ConnectionUser[];
  onMessage: (id: string) => void;
}

export const CompagnonsTab: React.FC<CompagnonsTabProps> = ({ list, onMessage }) => {
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
          <CompanionCard
            key={user.id}
            user={user}
            onMessage={onMessage}
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
          <CompanionRow
            key={user.id}
            user={user}
            onMessage={onMessage}
          />
        ))}
      </motion.div>
    </>
  );
};
