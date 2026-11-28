import React from 'react';
import { cn } from '@/src/lib/utils';

interface FiltersGenderProps {
  gender: 'Hommes' | 'Femmes' | 'Tout le monde';
  setGender: (gender: 'Hommes' | 'Femmes' | 'Tout le monde') => void;
}

export const FiltersGender: React.FC<FiltersGenderProps> = ({
  gender,
  setGender,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
        Show Me
      </label>
      <div className="grid grid-cols-3 gap-2">
        {['Hommes', 'Femmes', 'Tout le monde'].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGender(g as any)}
            className={cn(
              'py-2.5 rounded-xl text-[10px] font-black transition-all cursor-pointer border select-none text-center',
              gender === g
                ? 'bg-[#8B4A2B] border-[#8B4A2B] text-white'
                : 'bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-800 text-app-gray hover:text-app-black dark:hover:text-white'
            )}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
};
