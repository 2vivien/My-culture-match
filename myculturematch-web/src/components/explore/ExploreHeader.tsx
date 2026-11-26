import React from 'react';
import { Search } from 'lucide-react';

interface ExploreHeaderProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const ExploreHeader: React.FC<ExploreHeaderProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 shrink-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-app-black dark:text-zinc-100">
          Explore Communities
        </h1>
        <p className="text-xs text-app-gray dark:text-zinc-400 font-medium">
          Discover cultural matches, global companions, photos, and Reels.
        </p>
      </div>

      <div className="relative w-full md:w-72">
        <Search className="w-4.5 h-4.5 text-app-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search matching posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs rounded-full border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-app-black dark:text-zinc-100 placeholder:text-app-gray/70 focus:outline-none focus:border-[#E27D60] focus:ring-1 focus:ring-[#E27D60]"
        />
      </div>
    </div>
  );
};
