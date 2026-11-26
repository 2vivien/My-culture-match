import React from 'react';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { TribeItem } from '@/src/types/explore';

interface TribeCardProps {
  item: TribeItem;
  onJoin: (id: string) => void;
  onSelect: () => void;
  defaultLevel?: number;
}

export const TribeCard: React.FC<TribeCardProps> = ({ item, onJoin, onSelect, defaultLevel }) => {
  return (
    <div className="bg-white dark:bg-zinc-900/60 rounded-[20px] p-5 border border-app-border dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group relative">
      <button
        onClick={() => onJoin(item.id)}
        className={`absolute top-4 right-4 z-10 px-4 py-1.5 rounded-full text-[11px] font-black tracking-wide border transition-[transform,background-color,color] duration-150 active:scale-[0.97] focus:outline-none ${
          item.joined
            ? 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 border-zinc-200/70 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200/80 dark:hover:bg-zinc-700'
        }`}
      >
        {item.joined ? 'Joined' : 'Join'}
      </button>

      <div>
        <div 
          onClick={onSelect}
          className="flex items-center gap-3.5 mb-3.5 pr-24 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <ProfileAvatar
            src={item.avatar}
            alt={item.name}
            size="md"
            glow="none"
          />
          <div className="min-w-0">
            <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-100 truncate leading-tight group-hover:text-[#E27D60] transition-colors">
              {item.name}
            </h4>
            <p className="text-[10px] text-app-gray dark:text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
              {item.visitors} {defaultLevel ? 'visitors' : 'weekly matching'}
            </p>
          </div>
        </div>
        <p className="text-xs text-app-gray dark:text-zinc-400 leading-relaxed line-clamp-3">
          {item.desc}
        </p>
      </div>
    </div>
  );
};
