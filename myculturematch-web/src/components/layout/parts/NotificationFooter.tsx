import React from 'react';

interface NotificationFooterProps {
  onMarkAllRead: () => void;
}

export const NotificationFooter: React.FC<NotificationFooterProps> = ({
  onMarkAllRead,
}) => {
  return (
    <div className="mt-3 pt-2.5 border-t border-app-border dark:border-zinc-850 flex items-center justify-between select-none">
      <button
        type="button"
        onClick={onMarkAllRead}
        className="text-[10px] font-bold text-[#E27D60] dark:text-[#E27D60] hover:underline cursor-pointer"
      >
        Mark all as read
      </button>
      <span className="text-[9px] text-app-gray dark:text-zinc-500 font-bold uppercase tracking-widest">
        MyCultureMatch Synergy
      </span>
    </div>
  );
};
