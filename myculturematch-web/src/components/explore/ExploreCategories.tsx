import React from 'react';
import { Flame } from 'lucide-react';
import { ExploreTab } from '@/src/types/explore';

interface ExploreCategoriesProps {
  activeSubTab: ExploreTab;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

const CATEGORIES_MAP = {
  Tribu: ['All', 'Most Visited', 'Rituals & Ceremonies', 'Weaving & Crafts', 'Ancestral Art', 'Mythology & Tales', 'Gastronomy'],
  Connexion: ['All', '90%+ Matches', 'Shared Totems', 'Active Level'],
  Images: ['All', 'Rituals & Ceremonies', 'Weaving & Crafts', 'Ancestral Art', 'Mythology & Tales', 'Gastronomy'],
  Vidéo: ['All', 'Rituals & Ceremonies', 'Weaving & Crafts', 'Mythology & Tales'],
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
            className={`text-xs font-bold tracking-tight px-4 py-1.5 rounded-full border cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              isCatActive
                ? 'bg-[#E27D60] text-white border-[#E27D60] dark:bg-[#c66b50] dark:border-[#c66b50] shadow-sm'
                : 'bg-white dark:bg-zinc-900 border-app-border dark:border-zinc-800 text-app-gray hover:text-app-black dark:hover:text-zinc-200'
            }`}
          >
            {cat === 'Most Visited' && (
              <Flame className="w-3.5 h-3.5 fill-current text-orange-500 border-none" />
            )}
            {cat}
          </button>
        );
      })}
    </div>
  );
};
