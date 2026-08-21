import React from 'react';
import { Landmark, Unplug, Images, SquarePlay } from 'lucide-react';
import { ExploreTab } from '@/src/types/explore';

interface ExploreTabsProps {
  activeSubTab: ExploreTab;
  setActiveSubTab: (tab: ExploreTab) => void;
  setActiveCategory: (cat: string) => void;
}

const TABS: { id: ExploreTab; icon: React.ComponentType<any> }[] = [
  { id: 'Tribu', icon: Landmark },
  { id: 'Connexion', icon: Unplug },
  { id: 'Images', icon: Images },
  { id: 'Vidéo', icon: SquarePlay },
];

export const ExploreTabs: React.FC<ExploreTabsProps> = ({
  activeSubTab,
  setActiveSubTab,
  setActiveCategory,
}) => {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-gray-100/70 dark:bg-zinc-900/60 rounded-full w-fit mb-5 shrink-0 select-none border border-app-border/40 dark:border-zinc-800">
      {TABS.map(({ id, icon: Icon }) => {
        const isActive = activeSubTab === id;
        return (
          <button
            key={id}
            onClick={() => {
              setActiveSubTab(id);
              setActiveCategory('All');
            }}
            className={`flex items-center gap-1.5 px-4.5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
              isActive
                ? 'bg-app-black text-white dark:bg-white dark:text-app-black shadow-sm'
                : 'text-app-gray hover:text-app-black dark:hover:text-zinc-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {id}
          </button>
        );
      })}
    </div>
  );
};
