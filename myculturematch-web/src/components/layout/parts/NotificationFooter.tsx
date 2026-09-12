import React from 'react';

interface NotificationFooterProps {
  onMarkAllRead: () => void;
}

export const NotificationFooter: React.FC<NotificationFooterProps> = ({
  onMarkAllRead,
}) => {
  return (
    <div className="mt-3 pt-2.5 border-t border-app-border dark:border-zinc-800 flex items-center select-none">
      <button
        type="button"
        onClick={onMarkAllRead}
        className="text-xs font-bold text-[#E27D60] dark:text-[#E27D60] hover:underline cursor-pointer"
      >
        Mark all as read
      </button>
    </div>
  );
};
