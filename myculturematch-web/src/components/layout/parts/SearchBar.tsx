import React from 'react';
import { Search } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';

export const SearchBar = () => {
  const { searchQuery, setSearchQuery, setActiveTab, openAuthModal } = useUIStore();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  // Visiteur : la recherche est réservée aux membres, on ouvre la connexion.
  if (!isAuthenticated) {
    return (
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-full max-w-xl relative group select-none">
        <button
          type="button"
          onClick={openAuthModal}
          className="w-full bg-zinc-100 dark:bg-zinc-800 text-app-gray border border-app-border dark:border-zinc-800 rounded-full py-3 pl-12 pr-6 text-left shadow-sm text-base font-medium cursor-pointer"
        >
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5.5 h-5.5 text-app-gray" />
          </span>
          Connecte-toi pour rechercher…
        </button>
      </div>
    );
  }

  const handleSearchClick = () => {
    setActiveTab('Explore');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setActiveTab('Explore');
  };

  return (
    <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-full max-w-xl relative group select-none">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="w-5.5 h-5.5 text-app-gray group-focus-within:text-app-black dark:group-focus-within:text-white transition-colors" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={() => setActiveTab('Explore')}
        placeholder="Search..."
        className="w-full bg-zinc-100 dark:bg-zinc-800 text-app-black dark:text-white placeholder-app-gray border border-app-border dark:border-zinc-800 rounded-full py-3 pl-12 pr-28 shadow-sm focus:border-app-gray dark:focus:border-zinc-600 focus:ring-1 focus:ring-app-gray/40 dark:focus:ring-zinc-600 transition-all outline-none text-base font-medium"
      />
      <div className="absolute inset-y-1 right-1">
        <button
          onClick={handleSearchClick}
          className="bg-white dark:bg-zinc-800 text-app-black dark:text-white border border-app-border dark:border-zinc-700 px-6 py-2.5 rounded-full text-sm font-black hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer select-none"
        >
          Search
        </button>
      </div>
    </div>
  );
};
