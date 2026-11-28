import React from 'react';
import { FlairBadge } from '../tribu/FlairBadge';
import type { Flair } from '@/src/lib/tribeAccess';

interface FlairSelectorProps {
  flairs: Flair[];
  loading: boolean;
  selectedFlairId: string | null;
  onSelect: (flairId: string | null) => void;
}

/** Choix facultatif d'un flair à la création d'un post dans une tribu. */
export const FlairSelector: React.FC<FlairSelectorProps> = ({ flairs, loading, selectedFlairId, onSelect }) => {
  if (loading) {
    return (
      <p role="status" className="mb-4 text-[11px] font-semibold text-app-gray dark:text-zinc-500">
        Chargement des flairs…
      </p>
    );
  }
  if (flairs.length === 0) return null;

  return (
    <fieldset className="mb-6 border-0 p-0 m-0">
      <legend className="text-[10px] font-black uppercase tracking-wider text-app-gray dark:text-zinc-500 mb-2">
        Flair (facultatif)
      </legend>
      <div className="flex items-center gap-2 flex-wrap">
        {flairs.map((f) => {
          const selected = selectedFlairId === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(selected ? null : f.id)}
              className={`rounded-full cursor-pointer transition-opacity ${
                selectedFlairId && !selected ? 'opacity-50 hover:opacity-100' : ''
              } ${selected ? 'ring-2 ring-offset-1 ring-zinc-300 dark:ring-zinc-600' : ''}`}
            >
              <FlairBadge name={f.name} color={f.color} />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};
