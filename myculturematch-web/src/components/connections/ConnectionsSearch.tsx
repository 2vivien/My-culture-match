import React from 'react';
import { Search } from 'lucide-react';

interface ConnectionsSearchProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeSubTab: string;
}

const FunnelPlus = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    <path d="M19 14h4" />
    <path d="M21 12v4" />
  </svg>
);

export const ConnectionsSearch: React.FC<ConnectionsSearchProps> = ({
  searchQuery,
  setSearchQuery,
  activeSubTab,
}) => {
  const getPlaceholderText = () => {
    switch (activeSubTab) {
      case 'Suggestions': return 'les suggestions';
      case 'Interested': return 'les visites';
      case 'Demandes': return 'les demandes';
      default: return 'les compagnons';
    }
  };

  return (
    <div className="flex gap-3 mb-6 shrink-0">
      <div className="flex-1 relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
          <Search className="w-4.5 h-4.5" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Rechercher dans ${getPlaceholderText()}...`}
          className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-sm transition-colors placeholder:text-zinc-400"
        />
      </div>
      
      <button
        type="button"
        className="px-5 py-3.5 bg-zinc-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl flex items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer font-black text-xs transition-colors shrink-0"
      >
        <FunnelPlus className="w-3.5 h-3.5 text-[#E27D60]" />
        <span className="hidden sm:inline">Filtres</span>
      </button>
    </div>
  );
};
