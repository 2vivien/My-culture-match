import React, { useEffect } from 'react';
import { ChevronDown, X, Check, Globe2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TribeOption } from '@/src/types/createPost';

interface TribuSelectorProps {
  tribes: TribeOption[];
  selectedTribe: TribeOption | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  /** null = publication sans communauté (optionnelle). */
  onSelect: (tribe: TribeOption | null) => void;
}

export const TribuSelector: React.FC<TribuSelectorProps> = ({
  tribes,
  selectedTribe,
  isOpen,
  setIsOpen,
  onSelect,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div className="relative mb-6">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 rounded-full text-sm font-extrabold text-app-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        {selectedTribe ? (
          <div className="flex items-center gap-2">
            <img
              src={selectedTribe.avatar}
              alt={selectedTribe.name}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="truncate max-w-[150px]">{selectedTribe.name}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(null);
              }}
              className="ml-1 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
              title="Retirer la communauté"
            >
              <X className="w-3.5 h-3.5 text-app-gray" />
            </span>
          </div>
        ) : (
          <span className="text-zinc-600 dark:text-zinc-300">No community (optional)</span>
        )}
        <ChevronDown className="w-4 h-4 text-app-gray" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-800 rounded-[32px] shadow-2xl w-full max-w-md max-h-[75vh] flex flex-col overflow-hidden z-50 p-6 select-none"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-lg text-app-black dark:text-zinc-100">Select Tribu</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-app-gray dark:text-zinc-400 stroke-[2.5]" />
                </button>
              </div>

              {/* Tribes List */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 hide-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(null);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                    !selectedTribe
                      ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600'
                      : 'bg-zinc-50/50 dark:bg-zinc-900/60 border-app-border/40 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Globe2 className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                  </span>
                  <span className="font-bold text-sm text-app-black dark:text-zinc-200">No community</span>
                  {!selectedTribe && <Check className="w-5 h-5 text-zinc-600 dark:text-zinc-300 stroke-[3] ml-auto" />}
                </button>

                {tribes.map((tribe) => {
                  const isSelected = selectedTribe?.id === tribe.id;
                  return (
                    <button
                      key={tribe.id}
                      type="button"
                      onClick={() => {
                        onSelect(tribe);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600'
                          : 'bg-zinc-50/50 dark:bg-zinc-900/60 border-app-border/40 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-[1.01] active:scale-[0.99]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={tribe.avatar}
                          alt={tribe.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-white dark:border-zinc-900 shadow-sm"
                        />
                        <span className={`font-bold text-sm truncate ${
                          isSelected
                            ? 'text-app-black dark:text-zinc-100'
                            : 'text-app-black dark:text-zinc-300'
                        }`}>
                          {tribe.name}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-zinc-600 dark:text-zinc-300 stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
