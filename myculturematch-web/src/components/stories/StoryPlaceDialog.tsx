import { useState, type FormEvent } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { Dialog } from '@/src/components/ui/Dialog';
import { searchPlaces, type PlaceSearchResult } from '@/src/lib/placeSearch';

export interface StoryPlace {
  latitude: number;
  longitude: number;
  label: string;
}

type PlaceResult = PlaceSearchResult;

interface Props {
  /** Appelé avec le lieu choisi, ou null pour publier sans lieu. */
  onConfirm: (place: StoryPlace | null) => void;
  onCancel: () => void;
  busy?: boolean;
  /** Message d'erreur serveur à afficher (ex. partage de position désactivé). */
  error?: string | null;
}

/**
 * Choix facultatif d'un lieu pour une story. Le point choisi est ramené à une zone d'environ 1 km côté serveur :
 * la carte n'affiche jamais l'endroit exact, et seules les personnes autorisées à voir ta position voient la story.
 */
export const StoryPlaceDialog = ({ onConfirm, onCancel, busy = false, error = null }: Props) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [chosen, setChosen] = useState<PlaceResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term || searching) return;
    setSearching(true);
    setSearchError(false);
    try {
      setResults(await searchPlaces(term));
    } catch {
      setSearchError(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <Dialog onClose={busy ? () => {} : onCancel} labelledBy="story-place-title" className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-3xl p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="story-place-title" className="text-lg font-black flex items-center gap-2"><MapPin className="w-5 h-5" aria-hidden /> Ajouter à la carte ?</h2>
            <p className="text-xs text-zinc-500 mt-1 leading-5">Zone approximative (~1 km), visible seulement par les personnes autorisées à voir ta position. La story disparaît après 24 h.</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Fermer" className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input
            data-autofocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ville, quartier ou lieu"
            aria-label="Rechercher un lieu"
            className="flex-1 min-w-0 rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-sm outline-none"
          />
          <button type="submit" disabled={!query.trim() || searching} className="rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black px-4 py-2.5 text-xs font-black disabled:opacity-40">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Recherche" /> : 'Chercher'}
          </button>
        </form>

        {searchError && <p className="mt-2 text-xs text-red-600" role="alert">La recherche de lieu a échoué. Réessaie.</p>}

        {results.length > 0 && (
          <ul className="mt-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-900 max-h-44 overflow-y-auto" role="listbox" aria-label="Résultats">
            {results.map((r) => (
              <li key={r.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={chosen?.key === r.key}
                  onClick={() => setChosen(r)}
                  className={`w-full text-left px-3 py-2.5 text-sm ${chosen?.key === r.key ? 'bg-zinc-50 dark:bg-zinc-900 font-bold' : ''}`}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="mt-3 text-xs text-red-600" role="alert">{error}</p>}

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            disabled={!chosen || busy}
            onClick={() => chosen && onConfirm({ latitude: chosen.latitude, longitude: chosen.longitude, label: chosen.label })}
            className="w-full py-3 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black text-sm font-black disabled:opacity-40"
          >
            {busy ? 'Publication…' : chosen ? `Publier sur la carte · ${chosen.label}` : 'Choisis un lieu pour publier sur la carte'}
          </button>
          <button type="button" disabled={busy} onClick={() => onConfirm(null)} className="w-full py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm font-black disabled:opacity-40">
            Publier sans lieu
          </button>
        </div>
      </div>
    </Dialog>
  );
};
