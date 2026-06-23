import React from 'react';
import { MessageCircle, Bell, Heart, Calendar } from 'lucide-react';
import type { NotificationItem } from '@/src/types/notification';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';

interface NotificationItemViewProps {
  item: NotificationItem;
  onToggleRead: (id: string) => void;
  onAction: (id: string, action: 'accept' | 'decline') => void;
}

export const NotificationItemView: React.FC<NotificationItemViewProps> = ({
  item,
  onToggleRead,
  onAction,
}) => {
  return (
    <div
      onClick={() => onToggleRead(item.id)}
      className={`p-2.5 rounded-2xl flex gap-3 transition-colors relative group cursor-pointer ${
        item.isUnread 
          ? 'bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-850/50' 
          : 'hover:bg-zinc-50/30 dark:hover:bg-zinc-900/20'
      }`}
    >
      {/* Badge avatar indicator overlay style */}
      <div className="relative shrink-0 select-none">
        <TotemAvatar
          src={item.user.avatar}
          alt={item.user.name}
          size="sm"
          shape="cloud"
          glow="none"
        />
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-white dark:border-zinc-950 bg-white dark:bg-zinc-950 shadow-xs">
          {item.type === 'comment' && (
            <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-[#E27D60]/10 dark:bg-[#E27D60]/20">
              <MessageCircle className="w-2 h-2 text-[#E27D60] dark:text-[#E27D60]" />
            </span>
          )}
          {item.type === 'generation' && (
            <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50">
              <Bell className="w-2 h-2 text-emerald-600 dark:text-emerald-400" />
            </span>
          )}
          {item.type === 'invite' && (
            <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-purple-50 dark:bg-purple-950/50">
              <Calendar className="w-2 h-2 text-purple-600 dark:text-purple-400" />
            </span>
          )}
          {item.type === 'like' && (
            <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center bg-[#E27D60]/10 dark:bg-[#E27D60]/20">
              <Heart className="w-2 h-2 text-[#E27D60] dark:text-[#E27D60] fill-[#E27D60] dark:fill-[#E27D60]" />
            </span>
          )}
        </span>
      </div>

      {/* Text content details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs truncate text-app-black dark:text-zinc-200">
            {item.user.name}
          </span>
          <span className="text-[9px] text-app-gray dark:text-zinc-500 font-medium tracking-tight">
            {item.time}
          </span>
        </div>
        <p className="text-[11px] text-app-gray dark:text-zinc-400 mt-0.5 leading-snug">
          {item.user.action}{' '}
          <span className="font-black text-app-black dark:text-zinc-200">
            {item.user.target}
          </span>
        </p>

        {/* Accept / Decline actions */}
        {item.type === 'invite' && (
          <div className="flex gap-2.5 mt-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction(item.id, 'decline');
              }}
              className="px-4.5 py-2 text-xs font-black bg-[#E4E6EB] hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-app-black dark:text-zinc-200 rounded-xl cursor-pointer transition-colors"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction(item.id, 'accept');
              }}
              className="px-4.5 py-2 text-xs font-black bg-[#1A1A1A] hover:opacity-90 dark:bg-white text-white dark:text-app-black rounded-xl cursor-pointer transition-colors"
            >
              Accept
            </button>
          </div>
        )}
      </div>

      {/* Unread indicator dot */}
      {item.isUnread && (
        <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-emerald-500" />
      )}
    </div>
  );
};
