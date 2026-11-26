import React from 'react';
import { Search } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';

export const SearchBar = () => {
  const { searchQuery, setSearchQuery, setActiveTab } = useUIStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setActiveTab('Explore');
  };

  return (
    <div className="hidden md:flex flex-1 max-w-xl items-center h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 px-4 gap-2 transition-colors focus-within:bg-zinc-200/70 dark:focus-within:bg-zinc-700/70">
      <input
        type="text"
        value={searchQuery}
        onChange={handleChange}
        onFocus={() => setActiveTab('Explore')}
        aria-label="Search"
        className="flex-1 min-w-0 bg-transparent text-sm font-medium text-app-black dark:text-zinc-100 outline-none"
      />
      <button
        type="button"
        onClick={() => setActiveTab('Explore')}
        title="Search"
        className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-600 dark:text-zinc-300 hover:text-app-black dark:hover:text-white cursor-pointer shrink-0"
      >
        <Search className="w-4.5 h-4.5" />
      </button>
    </div>
  );
};
