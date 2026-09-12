import React from 'react';

interface FiltersInputsProps {
  origin: string;
  setOrigin: (origin: string) => void;
  location: string;
  setLocation: (location: string) => void;
}

export const FiltersInputs: React.FC<FiltersInputsProps> = ({
  origin,
  setOrigin,
  location,
  setLocation,
}) => {
  return (
    <>
      {/* Origin Input */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
          Origin / Culture
        </label>
        <div className="relative group">
          <input
            type="text"
            placeholder="Entrez l'origine souhaitée (ex: Fon, Yoruba, Celte...)"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full bg-[#FCFCFC] dark:bg-zinc-900 text-sm text-app-black dark:text-white border border-app-border dark:border-zinc-800 rounded-2xl py-2.5 px-4 outline-none focus:border-[#E27D60] focus:ring-1 focus:ring-[#E27D60]/20 transition-all placeholder:text-app-gray/60"
          />
        </div>
      </div>

      {/* Location Input */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
          Location
        </label>
        <div className="relative group">
          <input
            type="text"
            placeholder="City, region, or country..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-[#FCFCFC] dark:bg-zinc-900 text-sm text-app-black dark:text-white border border-app-border dark:border-zinc-800 rounded-2xl py-2.5 px-4 outline-none focus:border-[#E27D60] focus:ring-1 focus:ring-[#E27D60]/20 transition-all placeholder:text-app-gray/60"
          />
        </div>
      </div>
    </>
  );
};
