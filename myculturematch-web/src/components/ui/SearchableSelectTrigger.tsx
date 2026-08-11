import React from 'react';
import { ChevronDown, Loader2, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { SelectOption } from './SearchableSelect.types';

interface SearchableSelectTriggerProps {
  selected: SelectOption[];
  placeholder: string;
  multiple: boolean;
  showFlag: boolean;
  showMeta: boolean;
  loading: boolean;
  open: boolean;
  disabled: boolean;
  inputClassName?: string;
  onClick: () => void;
  onRemove: (value: string) => void;
}

export const SearchableSelectTrigger: React.FC<SearchableSelectTriggerProps> = ({
  selected,
  placeholder,
  multiple,
  showFlag,
  showMeta,
  loading,
  open,
  disabled,
  inputClassName,
  onClick,
  onRemove,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between gap-2 text-left bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors cursor-pointer px-4 py-4',
        !open && 'hover:border-zinc-300 dark:hover:border-zinc-700',
        open && 'border-primary dark:border-primary',
        disabled && 'opacity-60 cursor-not-allowed',
        inputClassName
      )}
    >
      <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
        {selected.length === 0 ? (
          <span className="text-zinc-400 dark:text-zinc-500 font-medium">{placeholder}</span>
        ) : multiple ? (
          selected.map((o) => (
            <span
              key={o.value}
              className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-bold"
            >
              {showFlag && o.flag && <span>{o.flag}</span>}
              <span className="truncate max-w-[160px]">{o.label}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(o.value);
                }}
                className="cursor-pointer hover:opacity-70"
                aria-label={`Retirer ${o.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="flex items-center gap-2 min-w-0">
            {showFlag && selected[0].flag && <span>{selected[0].flag}</span>}
            <span className="truncate font-semibold">{selected[0].label}</span>
            {showMeta && selected[0].meta && (
              <span className="text-zinc-400 dark:text-zinc-500 font-normal text-sm">
                {selected[0].meta}
              </span>
            )}
          </span>
        )}
      </div>
      {loading ? (
        <Loader2 className="w-4 h-4 shrink-0 text-zinc-400 animate-spin" />
      ) : (
        <ChevronDown
          className={cn('w-4 h-4 shrink-0 text-zinc-400 transition-transform', open && 'rotate-180')}
        />
      )}
    </button>
  );
};
