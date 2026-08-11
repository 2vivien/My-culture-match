import React from 'react';
import { useConnections } from '@/src/hooks/useConnections';
import { Users, Flame } from 'lucide-react';

export const StatsHeader: React.FC = () => {
  const { compagnonsCount, interestedCount } = useConnections();

  return (
    <div className="flex gap-4 p-4.5 bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 rounded-2xl shadow-sm">
      <div className="flex-1 flex items-center gap-3">
        <div className="p-3 bg-[#E27D60]/10 text-[#E27D60] rounded-xl">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-app-gray dark:text-zinc-500 uppercase tracking-wider">Compagnons</p>
          <h3 className="text-lg font-black text-app-black dark:text-zinc-100">{compagnonsCount}</h3>
        </div>
      </div>
      <div className="w-px bg-app-border dark:bg-zinc-800" />
      <div className="flex-1 flex items-center gap-3">
        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-app-gray dark:text-zinc-500 uppercase tracking-wider">Interested</p>
          <h3 className="text-lg font-black text-app-black dark:text-zinc-100">{interestedCount}</h3>
        </div>
      </div>
    </div>
  );
};
