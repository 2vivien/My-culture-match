import React from 'react';
import { Check, Plus } from 'lucide-react';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { TribeItem } from '@/src/types/explore';

interface TribeCardProps {
  item: TribeItem;
  onJoin: (id: string) => void;
  onSelect: () => void;
  defaultLevel?: number;
}

export const TribeCard: React.FC<TribeCardProps> = ({ item, onJoin, onSelect, defaultLevel }) => {
  return (
    <div className="bg-white dark:bg-zinc-900/60 rounded-[20px] p-5 border border-app-border dark:border-zinc-850 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group relative">
      <div>
        <div 
          onClick={onSelect}
          className="flex items-center gap-3.5 mb-3.5 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <TotemAvatar
            src={item.avatar}
            alt={item.name}
            size="md"
            glow={item.glow}
            level={item.glow === 'none' ? undefined : defaultLevel}
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
        <p className="text-xs text-app-gray dark:text-zinc-400 leading-relaxed line-clamp-3 mb-4">
          {item.desc}
        </p>
      </div>

      <button
        onClick={() => onJoin(item.id)}
        className={`w-full py-2 rounded-xl text-xs font-black cursor-pointer tracking-wider flex items-center justify-center gap-1.5 transition-all ${
          item.joined
            ? 'bg-zinc-100 dark:bg-zinc-850 text-app-black dark:text-zinc-200 border border-app-border dark:border-zinc-750'
            : 'bg-app-black text-white dark:bg-white dark:text-app-black hover:opacity-90'
        }`}
      >
        {item.joined ? (
          <>
            <Check className="w-3.5 h-3.5 stroke-[3.5] text-green-600" />
            Joined
          </>
        ) : (
          <>
            <Plus className="w-3.5 h-3.5 stroke-[3.5]" />
            Join
          </>
        )}
      </button>
    </div>
  );
};
