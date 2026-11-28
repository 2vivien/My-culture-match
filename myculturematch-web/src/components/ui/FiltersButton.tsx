import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface FiltersButtonProps {
  onClick: () => void;
  active?: boolean;
  className?: string;
}

export const FiltersButton: React.FC<FiltersButtonProps> = ({ onClick, active = false, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-3 md:px-3.5 md:py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 text-app-gray hover:text-app-black dark:hover:text-white border border-transparent dark:border-zinc-800 select-none shrink-0",
        className
      )}
    >
      <SlidersHorizontal className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#8B4A2B]" />
      <span className="hidden md:inline">Filters</span>
      {active && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#8B4A2B] animate-pulse" />
      )}
    </button>
  );
};
