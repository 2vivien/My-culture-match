import React from 'react';

interface FiltersAgeRangeProps {
  ageRange: [number, number];
  setAgeRange: (range: [number, number]) => void;
}

export const FiltersAgeRange: React.FC<FiltersAgeRangeProps> = ({
  ageRange,
  setAgeRange,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
          Age Range
        </label>
        <span className="text-[11px] font-black text-[#8B4A2B] bg-[#8B4A2B]/10 dark:bg-[#8B4A2B]/20 px-2 py-0.5 rounded-lg">
          {ageRange[0]} - {ageRange[1]}+
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1 select-none">
        <input
          type="range"
          min="18"
          max="60"
          value={ageRange[0]}
          onChange={(e) =>
            setAgeRange([parseInt(e.target.value), ageRange[1]])
          }
          className="w-full h-1 bg-zinc-400 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#8B4A2B]"
        />
        <input
          type="range"
          min="18"
          max="60"
          value={ageRange[1]}
          onChange={(e) =>
            setAgeRange([ageRange[0], parseInt(e.target.value)])
          }
          className="w-full h-1 bg-zinc-400 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#8B4A2B]"
        />
      </div>
    </div>
  );
};
