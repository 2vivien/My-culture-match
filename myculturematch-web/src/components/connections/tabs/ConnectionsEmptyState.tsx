import React from 'react';
import { motion } from 'framer-motion';
import { UserX } from 'lucide-react';

interface ConnectionsEmptyStateProps {
  searchQuery: string;
  activeSubTab: string;
}

export const ConnectionsEmptyState: React.FC<ConnectionsEmptyStateProps> = ({
  searchQuery,
  activeSubTab,
}) => {
  return (
    <motion.div
      key="empty-state"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-100 dark:border-zinc-850 text-zinc-400 mb-4">
        <UserX className="w-7 h-7" />
      </div>
      <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Aucun profil trouvé</h4>
      <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
        {searchQuery 
          ? `Aucun profil ne correspond à la recherche "${searchQuery}".` 
          : `Cette section est vide pour l'instant.`}
      </p>
    </motion.div>
  );
};
