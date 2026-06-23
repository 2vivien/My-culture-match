import React, { useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TribeOption } from '@/src/types/createTradition';

interface TribuSelectorProps {
  tribes: TribeOption[];
  selectedTribe: TribeOption | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelect: (tribe: TribeOption) => void;
}

export const TribuSelector: React.FC<TribuSelectorProps> = ({
  tribes,
  selectedTribe,
  isOpen,
  setIsOpen,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [setIsOpen]);

  return (
    <div className="relative mb-6" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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
          </div>
        ) : (
          <span>Select Tribu</span>
        )}
        <ChevronDown className="w-4 h-4 text-app-gray" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-850 rounded-2xl shadow-xl z-50 overflow-hidden py-1 max-h-60 overflow-y-auto">
          {tribes.map((tribe) => (
            <button
              key={tribe.id}
              type="button"
              onClick={() => onSelect(tribe)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-app-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <img
                src={tribe.avatar}
                alt={tribe.name}
                className="w-6 h-6 rounded-full object-cover shrink-0"
              />
              <span className="font-semibold truncate">{tribe.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
