import React, { useState } from 'react';
import { Settings2, Trash2, Plus, Loader2 } from 'lucide-react';
import { FlairBadge } from './FlairBadge';
import {
  FLAIR_DEFAULT_COLOR,
  isValidFlairColor,
  validateFlairName,
  type Flair,
} from '@/src/lib/tribeAccess';

interface TribuFlairBarProps {
  flairs: Flair[];
  activeFlairId: string | null;
  onSelect: (flairId: string | null) => void;
  canManage: boolean;
  onCreate: (input: { name: string; color: string }) => Promise<unknown>;
  creating: boolean;
  onDelete: (flairId: string) => void;
  deletingId: string | null;
}

/** Filtre par flair (?flairId=) et, pour les modérateurs, gestion (création / suppression). */
export const TribuFlairBar: React.FC<TribuFlairBarProps> = ({
  flairs,
  activeFlairId,
  onSelect,
  canManage,
  onCreate,
  creating,
  onDelete,
  deletingId,
}) => {
  const [managing, setManaging] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(FLAIR_DEFAULT_COLOR);
  const [error, setError] = useState<string | null>(null);

  if (flairs.length === 0 && !canManage) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameError = validateFlairName(name);
    if (nameError) return setError(nameError);
    if (!isValidFlairColor(color)) return setError('Couleur : format #RRGGBB');
    setError(null);
    try {
      await onCreate({ name: name.trim(), color });
      setName('');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Création du flair impossible');
    }
  };

  return (
    <section
      aria-label="Filtrer par flair"
      className="bg-white dark:bg-zinc-900/60 p-3 border border-app-border dark:border-zinc-800 rounded-[16px] shadow-xs flex flex-col gap-3"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          aria-pressed={activeFlairId === null}
          onClick={() => onSelect(null)}
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-colors ${
            activeFlairId === null
              ? 'bg-zinc-100 dark:bg-zinc-800 text-[#8B4A2B] border-[#8B4A2B]/40'
              : 'text-app-gray border-app-border dark:border-zinc-800 hover:text-app-black dark:hover:text-zinc-200'
          }`}
        >
          Tous
        </button>
        {flairs.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={activeFlairId === f.id}
            onClick={() => onSelect(activeFlairId === f.id ? null : f.id)}
            className={`rounded-full cursor-pointer transition-opacity ${
              activeFlairId && activeFlairId !== f.id ? 'opacity-50 hover:opacity-100' : ''
            } ${activeFlairId === f.id ? 'ring-2 ring-offset-1 ring-zinc-300 dark:ring-zinc-600' : ''}`}
          >
            <FlairBadge name={f.name} color={f.color} />
          </button>
        ))}
        {flairs.length === 0 && (
          <span className="text-[11px] text-app-gray dark:text-zinc-500 font-semibold">Aucun flair pour l’instant.</span>
        )}
        {canManage && (
          <button
            type="button"
            aria-expanded={managing}
            onClick={() => setManaging((v) => !v)}
            className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-app-gray hover:text-app-black dark:hover:text-zinc-200 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
            Gérer les flairs
          </button>
        )}
      </div>

      {canManage && managing && (
        <div className="border-t border-app-border/60 dark:border-zinc-800 pt-3 flex flex-col gap-3">
          {flairs.length > 0 && (
            <ul className="flex flex-col gap-1.5" aria-label="Flairs de la tribu">
              {flairs.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2">
                  <FlairBadge name={f.name} color={f.color} />
                  <button
                    type="button"
                    disabled={deletingId === f.id}
                    onClick={() => onDelete(f.id)}
                    aria-label={`Supprimer le flair ${f.name}`}
                    className="p-1.5 rounded-md text-app-gray hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === f.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={submit} className="flex items-end gap-2 flex-wrap" noValidate>
            <label className="flex flex-col gap-1 flex-1 min-w-[8rem]">
              <span className="text-[10px] font-black uppercase tracking-wider text-app-gray dark:text-zinc-500">Nouveau flair</span>
              <input
                type="text"
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Recette"
                className="px-3 py-2 text-xs rounded-xl border border-app-border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-200 focus:outline-none focus:border-[#8B4A2B]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-app-gray dark:text-zinc-500">Couleur</span>
              <input
                type="color"
                value={isValidFlairColor(color) ? color.toLowerCase() : FLAIR_DEFAULT_COLOR.toLowerCase()}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Couleur du flair"
                className="h-[34px] w-12 rounded-lg border border-app-border dark:border-zinc-800 bg-transparent cursor-pointer"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#8B4A2B] hover:bg-[#6F3A22] text-white text-xs font-black cursor-pointer disabled:opacity-60"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Plus className="w-3.5 h-3.5" aria-hidden="true" />}
              Ajouter
            </button>
          </form>
          {error && (
            <p role="alert" className="text-[11px] font-bold text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
};
