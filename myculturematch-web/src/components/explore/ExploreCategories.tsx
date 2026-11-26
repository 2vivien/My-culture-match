import React from 'react';
import { ExploreTab } from '@/src/types/explore';
import { launchThemes } from '@/src/lib/themes';

interface ExploreCategoriesProps {
  activeSubTab: ExploreTab;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

const CATEGORIES_MAP = {
  Tribu: ['All', ...launchThemes],
  Posts: ['All', ...launchThemes],
  Reels: ['All'],
  Vidéo: ['All', ...launchThemes],
};

export const ExploreCategories: React.FC<ExploreCategoriesProps> = ({
  activeSubTab,
  activeCategory,
  setActiveCategory,
}) => {
  const categories = CATEGORIES_MAP[activeSubTab];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pr-2 pb-3 mb-6 shrink-0 hide-scrollbar select-none">
      {categories.map((cat) => {
        const isCatActive = activeCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs font-bold tracking-tight px-4 py-1.5 rounded-md border cursor-pointer whitespace-nowrap transition-colors ${
              isCatActive
                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-600'
                : 'bg-transparent border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};
