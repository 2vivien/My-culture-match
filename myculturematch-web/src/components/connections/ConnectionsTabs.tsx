import React from 'react';
import { useConnections } from '@/src/hooks/useConnections';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';
import { Compass, MousePointerClick, Plug, Unplug } from 'lucide-react';

export const ConnectionsTabs: React.FC = () => {
  const { activeSubTab, setActiveSubTab, suggestionsCount, interestedCount, demandesCount, compagnonsCount } = useConnections();

  const tabs = [
    { key: 'Suggestions', label: 'Suggestions', count: suggestionsCount, icon: Compass, showCount: false },
    { key: 'Interested', label: 'Interested', count: interestedCount, icon: MousePointerClick, showCount: true },
    { key: 'Demandes', label: 'Demandes', count: demandesCount, icon: Unplug, showCount: true },
    { key: 'Compagnons', label: 'Compagnons', count: compagnonsCount, icon: Unplug, showCount: true },
  ] as const;

  return (
    <div className="flex border-b border-app-border dark:border-zinc-850 overflow-x-auto shrink-0 select-none hide-scrollbar">
      <div className="flex min-w-full px-1">
        {tabs.map(({ key, label, count, icon: Icon, showCount }) => {
          const isActive = activeSubTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveSubTab(key)}
              className={cn(
                "flex-1 min-w-[70px] md:min-w-[130px] text-center py-3 text-xs font-black cursor-pointer tracking-wider transition-all relative whitespace-nowrap px-2 flex items-center justify-center gap-1.5",
                isActive ? "text-[#E27D60] dark:text-[#E27D60]" : "text-app-gray hover:text-app-black dark:hover:text-zinc-200"
              )}
            >
              <Icon className="w-4 h-4 md:w-3.5 md:h-3.5 shrink-0" />
              <span className="hidden md:inline">{label}</span>
              {showCount && count > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none min-w-[16px] text-center",
                  isActive ? "bg-[#E27D60] text-white" : "bg-zinc-100 dark:bg-zinc-800 text-app-gray"
                )}>
                  {count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="connections-active-line"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#E27D60] rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
