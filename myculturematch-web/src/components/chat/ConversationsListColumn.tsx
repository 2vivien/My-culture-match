import React, { useState } from 'react';
import { Search, Globe2 } from 'lucide-react';
import { Conversation } from '@/src/types/chat.types';
import { ConversationListItem } from './ConversationListItem';

interface ListColumnProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const ConversationsListColumn: React.FC<ListColumnProps> = ({
  conversations,
  activeId,
  onSelect,
}) => {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.culture.toLowerCase().includes(search.toLowerCase()) ||
    c.lang.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full md:w-80 border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 rounded-[24px] flex flex-col h-full select-none shadow-soft shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-base text-app-black dark:text-zinc-100 flex items-center gap-1.5">
            Messages
            <span className="text-[10px] uppercase tracking-wider bg-[#E27D60]/10 text-[#E27D60] px-2 py-0.5 rounded-full font-black">
              {conversations.filter((c) => c.online).length} Live
            </span>
          </h2>
          <p className="text-[11px] text-app-gray dark:text-zinc-500">Culture Matchmaking Room</p>
        </div>
        <Globe2 className="w-4 h-4 text-app-gray animate-spin-slow" />
      </div>

      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Search world connections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#FEFEFE] dark:bg-zinc-900 border border-app-border dark:border-zinc-800 rounded-2xl py-2 pl-9 pr-4 text-xs text-app-black dark:text-zinc-200 placeholder:text-app-gray outline-none focus:ring-1 focus:ring-[#E27D60] focus:border-[#E27D60] transition-all font-medium"
        />
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-app-gray" />
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 hide-scrollbar">
        {filtered.length > 0 ? (
          filtered.map((c) => (
            <ConversationListItem
              key={c.id}
              conversation={c}
              isActive={c.id === activeId}
              onClick={() => onSelect(c.id)}
            />
          ))
        ) : (
          <div className="text-center py-10 text-xs text-app-gray">
            No cultural matches found.
          </div>
        )}
      </div>
    </div>
  );
};
