import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface FilterState {
  origin: string;
  location: string;
  distance: string;
  ageRange: [number, number];
  gender: 'Hommes' | 'Femmes' | 'Tout le monde';
}

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onApply?: () => void;
}

export const FiltersModal: React.FC<FiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  onApply,
}) => {
  const handleReset = () => {
    setFilters({
      origin: '',
      location: '',
      distance: 'Partout',
      ageRange: [18, 60],
      gender: 'Tout le monde',
    });
  };

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-850 rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl relative p-6 text-app-black dark:text-zinc-100 flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-app-border/40 dark:border-zinc-800/40">
              <div>
                <h3 className="text-xl font-black text-app-black dark:text-white">Filters</h3>
                <button
                  onClick={handleReset}
                  className="text-[#E27D60] text-[10px] font-black uppercase tracking-wider mt-1 hover:underline cursor-pointer"
                >
                  Reset all
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-app-border dark:border-zinc-800 text-app-black dark:text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1 hide-scrollbar">
              {/* Origin Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                  Origin / Culture
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Enter desired origin (e.g. Yamato, Celtic...)"
                    value={filters.origin}
                    onChange={(e) => setFilters((prev) => ({ ...prev, origin: e.target.value }))}
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
                    value={filters.location}
                    onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-[#FCFCFC] dark:bg-zinc-900 text-sm text-app-black dark:text-white border border-app-border dark:border-zinc-800 rounded-2xl py-2.5 px-4 outline-none focus:border-[#E27D60] focus:ring-1 focus:ring-[#E27D60]/20 transition-all placeholder:text-app-gray/60"
                  />
                </div>
              </div>

              {/* Distance Radius */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                  Search Radius
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['10km', '50km', '100km', 'Partout'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setFilters((prev) => ({ ...prev, distance: d }))}
                      className={cn(
                        'py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer border select-none text-center',
                        filters.distance === d
                          ? 'bg-[#E27D60] border-[#E27D60] text-white'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-800 text-app-gray hover:text-app-black dark:hover:text-white'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range Inputs */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                    Age Range
                  </label>
                  <span className="text-[11px] font-black text-[#E27D60] bg-[#E27D60]/10 dark:bg-[#E27D60]/20 px-2 py-0.5 rounded-lg">
                    {filters.ageRange[0]} - {filters.ageRange[1]}+
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 select-none">
                  <input
                    type="range"
                    min="18"
                    max="60"
                    value={filters.ageRange[0]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        ageRange: [parseInt(e.target.value), prev.ageRange[1]],
                      }))
                    }
                    className="w-full h-1 bg-zinc-250 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#E27D60]"
                  />
                  <input
                    type="range"
                    min="18"
                    max="60"
                    value={filters.ageRange[1]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        ageRange: [prev.ageRange[0], parseInt(e.target.value)],
                      }))
                    }
                    className="w-full h-1 bg-zinc-250 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#E27D60]"
                  />
                </div>
              </div>

              {/* Target Gender / Afficher */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                  Show Me
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Hommes', 'Femmes', 'Tout le monde'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setFilters((prev) => ({ ...prev, gender: g as any }))}
                      className={cn(
                        'py-2.5 rounded-xl text-[10px] font-black transition-all cursor-pointer border select-none text-center',
                        filters.gender === g
                          ? 'bg-[#E27D60] border-[#E27D60] text-white'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-800 text-app-gray hover:text-app-black dark:hover:text-white'
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApply}
              className="w-full bg-[#E27D60] text-white py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:brightness-105 transition-all cursor-pointer select-none mt-2"
            >
              Apply Filters
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
