import React from 'react';
import { cn } from '@/src/lib/utils';

interface FiltersRadiusProps {
  distance: string;
  setDistance: (distance: string) => void;
}

export const FiltersRadius: React.FC<FiltersRadiusProps> = ({
  distance,
  setDistance,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
        Search Radius
      </label>
      <div className="grid grid-cols-4 gap-1.5">
        {['10km', '50km', '100km', 'Partout'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDistance(d)}
            className={cn(
              'py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer border select-none text-center',
              distance === d
                ? 'bg-[#8B4A2B] border-[#8B4A2B] text-white'
                : 'bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-800 text-app-gray hover:text-app-black dark:hover:text-white'
            )}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
};
