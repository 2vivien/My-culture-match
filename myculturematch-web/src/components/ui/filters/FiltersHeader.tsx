import React from 'react';
import { X } from 'lucide-react';

interface FiltersHeaderProps {
  onReset: () => void;
  onClose: () => void;
}

export const FiltersHeader: React.FC<FiltersHeaderProps> = ({ onReset, onClose }) => {
  return (
    <div className="flex justify-between items-center pb-2 border-b border-app-border/40 dark:border-zinc-800/40">
      <div>
        <h3 className="text-xl font-black text-app-black dark:text-white">Filters</h3>
        <button
          type="button"
          onClick={onReset}
          className="text-[#8B4A2B] text-[10px] font-black uppercase tracking-wider mt-1 hover:underline cursor-pointer"
        >
          Reset all
        </button>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-app-border dark:border-zinc-800 text-app-black dark:text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
