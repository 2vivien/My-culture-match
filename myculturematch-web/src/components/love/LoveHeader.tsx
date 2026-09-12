import React from 'react';

interface LoveHeaderProps {
  setShowFilters?: (show: boolean) => void;
  isFiltersActive?: boolean;
}

export const LoveHeader: React.FC<LoveHeaderProps> = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-app-border dark:border-zinc-800 pb-5 pt-2">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-app-black dark:text-white">
          Find Love
        </h1>
      </div>
    </div>
  );
};
