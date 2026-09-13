import React from 'react';
import { motion } from 'framer-motion';
import { UserCard } from '../UserCard';
import { UserRow } from '../UserRow';
import { PeopleNearbyMap } from '../PeopleNearbyMap';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

interface SuggestionsTabProps { list: ConnectionUser[]; onConnect: (id: string) => void; }

export const SuggestionsTab: React.FC<SuggestionsTabProps> = ({ list, onConnect }) => (
  <>
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mb-6">
      <PeopleNearbyMap />
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map(user => <UserCard key={user.id} user={user} onConnect={onConnect} />)}
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="md:hidden flex flex-col gap-3.5">
      {list.map(user => <UserRow key={user.id} user={user} onConnect={onConnect} />)}
    </motion.div>
  </>
);
