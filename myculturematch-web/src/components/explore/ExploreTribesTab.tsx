import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/src/components/ui/button';
import { TribeCard } from './TribeCard';
import { TribeItem } from '@/src/types/explore';

interface ExploreTribesTabProps {
  filteredTribes: TribeItem[];
  moreTribes: TribeItem[];
  toggleJoinTribe: (id: string, isMore?: boolean) => void;
  setActiveTab: (tab: string) => void;
}

export const ExploreTribesTab: React.FC<ExploreTribesTabProps> = ({
  filteredTribes,
  moreTribes,
  toggleJoinTribe,
  setActiveTab,
}) => {
  return (
    <motion.div
      key="tribu-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      <div>
        <h3 className="text-xs font-black text-app-gray dark:text-zinc-400 uppercase tracking-widest mb-4">
          Recommended for you
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTribes.map((item) => (
            <TribeCard
              key={item.id}
              item={item}
              onJoin={(id) => toggleJoinTribe(id, false)}
              onSelect={() => setActiveTab('Tribu')}
            />
          ))}
        </div>

        {filteredTribes.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" className="text-xs font-extrabold rounded-md px-8 py-2.5 bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              Show more
            </Button>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-black text-app-gray dark:text-zinc-400 uppercase tracking-widest mb-4">
          More like your Profile Match
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {moreTribes.map((item) => (
            <TribeCard
              key={item.id}
              item={item}
              onJoin={(id) => toggleJoinTribe(id, true)}
              onSelect={() => setActiveTab('Tribu')}
              defaultLevel={12}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
