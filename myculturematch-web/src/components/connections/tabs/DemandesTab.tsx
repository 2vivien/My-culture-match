import React from 'react';
import { motion } from 'framer-motion';
import { RequestCard } from '../RequestCard';
import { RequestRow } from '../RequestRow';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

interface DemandesTabProps {
  list: ConnectionUser[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export const DemandesTab: React.FC<DemandesTabProps> = ({ list, onAccept, onDecline }) => {
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
          <RequestCard
            key={user.id}
            user={user}
            onAccept={onAccept}
            onDecline={onDecline}
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
          <RequestRow
            key={user.id}
            user={user}
            onAccept={onAccept}
            onDecline={onDecline}
          />
        ))}
      </motion.div>
    </>
  );
};
