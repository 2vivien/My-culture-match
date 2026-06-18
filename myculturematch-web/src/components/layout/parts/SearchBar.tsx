import { Search } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';

export const SearchBar = () => {
  const { searchQuery, setSearchQuery } = useUIStore();

  return (
    <div className="flex-1 max-w-xl mx-auto md:mx-0 relative group select-none">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-app-gray group-focus-within:text-app-black transition-colors" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
        className="w-full bg-white text-app-black placeholder-app-gray border border-app-border rounded-full py-2.5 pl-11 pr-4 sm:pr-24 shadow-sm focus:border-app-black focus:ring-1 focus:ring-app-black transition-all outline-none text-xs sm:text-sm"
      />
      <div className="absolute inset-y-1 right-1 hidden sm:block">
        <button className="bg-app-black text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer select-none">
          Search
        </button>
      </div>
    </div>
  );
};
