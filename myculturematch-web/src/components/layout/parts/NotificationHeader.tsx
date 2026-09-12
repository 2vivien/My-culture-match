import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationHeaderProps {
  filter: 'all' | 'unread';
  setFilter: (filter: 'all' | 'unread') => void;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  filter,
  setFilter,
}) => {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-app-border dark:border-zinc-800">
      <h3 className="font-black text-base text-app-black dark:text-zinc-100 flex items-center gap-2">
        <Bell className="w-5 h-5 text-[#6c63fc] dark:text-[#2dd9d9]" />
        Notifications
      </h3>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-zinc-100 dark:bg-zinc-800 text-app-black dark:text-white'
              : 'text-app-gray hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
            filter === 'unread'
              ? 'bg-zinc-100 dark:bg-zinc-800 text-app-black dark:text-white'
              : 'text-app-gray hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          Unread
        </button>
      </div>
    </div>
  );
};
