import React from 'react';
import { motion } from 'framer-motion';
import { useNotifications } from '@/src/hooks/useNotifications';
import { NotificationHeader } from './NotificationHeader';
import { NotificationItemView } from './NotificationItemView';
import { NotificationFooter } from './NotificationFooter';

export const NotificationDropdown: React.FC = () => {
  const {
    filter,
    setFilter,
    displayedNotifications,
    handleAction,
    markAllRead,
    toggleReadState,
  } = useNotifications();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-32px)] bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-850 rounded-[24px] shadow-xl overflow-hidden z-50 p-4"
    >
      <NotificationHeader filter={filter} setFilter={setFilter} />

      <div className="mt-3 space-y-3.5 max-h-[360px] overflow-y-auto pr-1 hide-scrollbar">
        {displayedNotifications.length > 0 ? (
          displayedNotifications.map((item) => (
            <NotificationItemView
              key={item.id}
              item={item}
              onToggleRead={toggleReadState}
              onAction={handleAction}
            />
          ))
        ) : (
          <div className="text-center py-12 text-xs text-app-gray select-none">
            No active notifications in this category.
          </div>
        )}
      </div>

      <NotificationFooter onMarkAllRead={markAllRead} />
    </motion.div>
  );
};
