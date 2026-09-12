import React from 'react';
import { Flame } from 'lucide-react';

interface LoveHeaderProps {
  setShowFilters: (show: boolean) => void;
  isFiltersActive: boolean;
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

export const LoveHeader: React.FC<LoveHeaderProps> = ({
  setShowFilters,
  isFiltersActive,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-app-border dark:border-zinc-800 pb-5 pt-2">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-app-black dark:text-white flex items-center gap-2">
          <Flame className="w-6 h-6 text-[#E27D60] fill-[#E27D60]" />
          Find Love
        </h1>
        <p className="text-xs text-app-gray mt-1 font-medium">
          Find high-vibe soul matches and explore shared cultural heritages worldwide.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 select-none">
        <button
          onClick={() => setShowFilters(true)}
          className="px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 text-app-gray hover:text-app-black dark:hover:text-white border border-transparent dark:border-zinc-800"
        >
          <FunnelPlus className="w-3.5 h-3.5 text-[#E27D60]" />
          <span className="hidden sm:inline">Filters</span>
          {isFiltersActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#E27D60] animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
};
