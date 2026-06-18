import React from 'react';
import { Conversation } from '@/src/types/chat.types';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { cn } from '@/src/lib/utils';

interface ListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationListItem: React.FC<ListItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all relative border border-transparent cursor-pointer group',
        isActive
          ? 'bg-white dark:bg-zinc-900 border-app-border dark:border-zinc-805 shadow-sm'
          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40 text-app-gray hover:text-app-black dark:text-zinc-400 dark:hover:text-white'
      )}
    >
      <div className="relative shrink-0">
        <TotemAvatar
          src={conversation.avatar}
          alt={conversation.name}
          size="sm"
          glow={conversation.glow as any}
          level={conversation.level}
        />
        {conversation.online && (
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950 z-10" />
        )}
      </div>

      <div className="flex-1 min-w-0 select-none">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="font-bold text-xs truncate text-app-black dark:text-zinc-100 group-hover:text-[#E27D60] transition-colors">
            {conversation.name}
          </span>
          <span className="text-[10px] text-app-gray dark:text-zinc-500 shrink-0">
            {conversation.timeAgo}
          </span>
        </div>
        <p className="text-[11px] text-app-gray dark:text-zinc-400 truncate leading-tight">
          {conversation.lastMsg}
        </p>
      </div>

      {conversation.unreadCount > 0 && (
        <span className="w-4 h-4 rounded-full bg-[#E27D60] text-[9px] font-bold text-white flex items-center justify-center shrink-0">
          {conversation.unreadCount}
        </span>
      )}
    </button>
  );
};
