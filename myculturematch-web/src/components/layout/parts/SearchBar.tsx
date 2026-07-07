import React from 'react';
import { Search } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';

export const SearchBar = () => {
  const { searchQuery, setSearchQuery, setActiveTab } = useUIStore();

  const handleSearchClick = () => {
    setActiveTab('Explore');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setActiveTab('Explore'); // Search always redirects to explore
  };

  return (
    <div className="hidden md:block flex-1 max-w-xl relative group select-none">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-app-gray group-focus-within:text-app-black transition-colors" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={() => setActiveTab('Explore')}
        placeholder="Search..."
        className="w-full bg-white dark:bg-zinc-900 text-app-black dark:text-white placeholder-app-gray border border-app-border dark:border-zinc-800 rounded-full py-2.5 pl-11 pr-24 shadow-sm focus:border-app-black dark:focus:border-zinc-700 focus:ring-1 focus:ring-app-black dark:focus:ring-zinc-700 transition-all outline-none text-sm"
      />
      <div className="absolute inset-y-1 right-1">
        <button
          onClick={handleSearchClick}
          className="bg-app-black text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer select-none"
        >
          Search
        </button>
      </div>
    </div>
  );
};
