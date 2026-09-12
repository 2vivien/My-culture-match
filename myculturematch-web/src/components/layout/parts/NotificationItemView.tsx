import React from 'react';
import { MessageCircle, Bell, Heart, UserPlus } from 'lucide-react';
import { IconMoodHeart, IconFriends } from '@tabler/icons-react';
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
      className={`p-3 rounded-2xl flex gap-3.5 transition-colors relative group cursor-pointer ${
        item.isUnread
          ? 'bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
          : 'hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30'
      }`}
    >
      {/* Avatar + badge type superposé */}
      <div className="relative shrink-0 select-none">
        <TotemAvatar
          src={item.user.avatar}
          alt={item.user.name}
          size="md"
          shape="cloud"
          glow="none"
        />
        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border border-white dark:border-zinc-950 bg-white dark:bg-zinc-950 shadow-sm">
          {item.type === 'comment' && (
            <span className="w-4.5 h-4.5 rounded-full flex items-center justify-center bg-[#E27D60]/10 dark:bg-[#E27D60]/20">
              <MessageCircle className="w-3 h-3 text-[#E27D60] dark:text-[#E27D60]" />
            </span>
          )}
          {item.type === 'generation' && (
            <span className="w-4.5 h-4.5 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/50">
              <Bell className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            </span>
          )}
          {(item.type === 'invite' || item.type === 'request') && (
            // Demande d'ami → icône Friends
            <span className="w-4.5 h-4.5 rounded-full flex items-center justify-center bg-sky-50 dark:bg-sky-950/50">
              <IconFriends className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            </span>
          )}
          {item.type === 'like' && (
            // Like → cœur simple
            <span className="w-4.5 h-4.5 rounded-full flex items-center justify-center bg-[#E27D60]/10 dark:bg-[#E27D60]/20">
              <Heart className="w-3 h-3 text-[#E27D60] dark:text-[#E27D60] fill-[#E27D60] dark:fill-[#E27D60]" />
            </span>
          )}
          {item.type === 'match' && (
            // Match / intérêt → icône Tabler mood-heart
            <span className="w-4.5 h-4.5 rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-950/50">
              <IconMoodHeart className="w-3 h-3 text-rose-500 dark:text-rose-400" />
            </span>
          )}
        </span>
      </div>

      {/* Texte */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-extrabold text-sm truncate text-app-black dark:text-zinc-100">
            {item.user.username || item.user.name}
          </span>
          <span className="text-xs text-app-gray dark:text-zinc-500 font-medium shrink-0">
            {item.time}
          </span>
        </div>
        <p className="text-sm text-app-gray dark:text-zinc-400 mt-0.5 leading-snug">
          {item.user.action}{' '}
          <span className="font-bold text-app-black dark:text-zinc-100">
            {item.user.target}
          </span>
        </p>

        {/* Accept / Decline */}
        {(item.type === 'invite' || item.type === 'request') && (
          <div className="flex gap-2.5 mt-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction(item.id, 'decline');
              }}
              className="px-5 py-2.5 text-sm font-bold bg-[#E4E6EB] hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-app-black dark:text-zinc-200 rounded-xl cursor-pointer transition-colors"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction(item.id, 'accept');
              }}
              className="px-5 py-2.5 text-sm font-bold bg-[#E27D60] hover:bg-[#c66b50] text-white rounded-xl cursor-pointer transition-colors"
            >
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
