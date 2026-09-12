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
  Traditions: ['All', ...launchThemes],
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
    <div className="flex items-center gap-2 overflow-x-auto pr-2 pb-3 mb-6 shrink-0 custom-scrollbar-x select-none">
      {categories.map((cat) => {
        const isCatActive = activeCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs font-bold tracking-tight px-4 py-1.5 rounded-full border cursor-pointer whitespace-nowrap transition-colors ${
              isCatActive
                ? 'bg-[#E27D60] text-white border-[#E27D60] dark:bg-[#c66b50] dark:border-[#c66b50] shadow-sm'
                : 'bg-white dark:bg-zinc-900 border-app-border dark:border-zinc-800 text-app-gray hover:text-app-black dark:hover:text-zinc-200'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};
