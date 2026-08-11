import React from 'react';

export const TribuAbout: React.FC = () => {
  return (
    <div className="bg-white dark:bg-zinc-900/60 border border-app-border dark:border-zinc-800 rounded-[20px] p-5 shadow-xs">
      <h3 className="font-extrabold text-sm text-app-black dark:text-zinc-200">
        About YamatoTribe
      </h3>
      <p className="text-xs text-app-gray dark:text-zinc-400 leading-relaxed mt-2.5">
        This is the Yamato Tribe discussion hub to help you discover ancestral traditions, Yamato dialects, and historical celebrations passed down through generations.
      </p>

      {/* Created info */}
      <div className="mt-4 pt-3 border-t border-app-border/70 dark:border-zinc-800 text-[11px] text-app-gray dark:text-zinc-400 font-bold flex justify-between">
        <span>Created Jan 23, 2023</span>
        <span className="text-[#E27D60] dark:text-[#E27D60]">Public Hub</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mt-5 pt-3 border-t border-app-border/70 dark:border-zinc-800">
        <div>
          <span className="font-black text-base text-app-black dark:text-zinc-100">
            2.1M
          </span>
          <p className="text-[10px] text-app-gray dark:text-zinc-500 font-bold uppercase mt-0.5">
            Weekly visitors
          </p>
        </div>
        <div>
          <span className="font-black text-base text-app-black dark:text-zinc-100">
            44K
          </span>
          <p className="text-[10px] text-app-gray dark:text-zinc-500 font-bold uppercase mt-0.5">
            Contributions
          </p>
        </div>
      </div>

      {/* Guide button */}
      <button className="w-full text-xs font-black rounded-xl py-2.5 mt-5 bg-[#E27D60] hover:bg-[#c66b50] text-white shadow-xs transition-colors cursor-pointer">
        View Tribe Guide
      </button>
    </div>
  );
};
