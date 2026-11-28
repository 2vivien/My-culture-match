import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiltersHeader } from './filters/FiltersHeader';
import { FiltersInputs } from './filters/FiltersInputs';
import { FiltersRadius } from './filters/FiltersRadius';
import { FiltersAgeRange } from './filters/FiltersAgeRange';
import { FiltersGender } from './filters/FiltersGender';

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

  const setOrigin = (origin: string) => setFilters(prev => ({ ...prev, origin }));
  const setLocation = (location: string) => setFilters(prev => ({ ...prev, location }));
  const setDistance = (distance: string) => setFilters(prev => ({ ...prev, distance }));
  const setAgeRange = (ageRange: [number, number]) => setFilters(prev => ({ ...prev, ageRange }));
  const setGender = (gender: 'Hommes' | 'Femmes' | 'Tout le monde') => setFilters(prev => ({ ...prev, gender }));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-800 rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl relative p-6 text-app-black dark:text-zinc-100 flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <FiltersHeader onReset={handleReset} onClose={onClose} />

            <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1 hide-scrollbar">
              <FiltersInputs
                origin={filters.origin}
                setOrigin={setOrigin}
                location={filters.location}
                setLocation={setLocation}
              />

              <FiltersRadius
                distance={filters.distance}
                setDistance={setDistance}
              />

              <FiltersAgeRange
                ageRange={filters.ageRange}
                setAgeRange={setAgeRange}
              />

              <FiltersGender
                gender={filters.gender}
                setGender={setGender}
              />
            </div>

            <button
              type="button"
              onClick={handleApply}
              className="w-full bg-[#8B4A2B] text-white py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:brightness-105 transition-all cursor-pointer select-none mt-2"
            >
              Apply Filters
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
