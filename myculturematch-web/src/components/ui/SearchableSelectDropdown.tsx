import React from 'react';
import { Check, Search } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { SelectOption } from './SearchableSelect.types';

interface SearchableSelectDropdownProps {
  open: boolean;
  query: string;
  setQuery: (query: string) => void;
  filtered: SelectOption[];
  showFlag: boolean;
  showMeta: boolean;
  emptyLabel: string;
  searchRef: React.RefObject<HTMLInputElement | null>;
  isSelected: (value: string) => boolean;
  onToggle: (option: SelectOption) => void;
}

export const SearchableSelectDropdown: React.FC<SearchableSelectDropdownProps> = ({
  open,
  query,
  setQuery,
  filtered,
  showFlag,
  showMeta,
  emptyLabel,
  searchRef,
  isSelected,
  onToggle,
}) => {
  if (!open) return null;

  return (
    <div className="absolute z-50 mt-2 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <Search className="w-4 h-4 text-zinc-400 shrink-0" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher..."
          className="w-full bg-transparent outline-none text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
        />
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-zinc-400">{emptyLabel}</p>
        ) : (
          filtered.map((o) => {
            const active = isSelected(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onToggle(o)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                )}
              >
                {showFlag && o.flag && <span className="text-lg leading-none">{o.flag}</span>}
                <span className="flex-1 min-w-0">
                  <span className="block truncate font-semibold">{o.label}</span>
                  {o.native && o.native !== o.label && (
                    <span className="block text-xs text-zinc-400 truncate">{o.native}</span>
                  )}
                </span>
                {showMeta && o.meta && (
                  <span className="text-xs text-zinc-400 font-semibold">{o.meta}</span>
                )}
                {active && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
