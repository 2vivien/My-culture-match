import { useState, type FormEvent } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';
import { api, ApiError } from '@/src/services/api';
import { Dialog } from '@/src/components/ui/Dialog';
import { searchPlaces, type PlaceSearchResult } from '@/src/lib/placeSearch';
import { PLACE_CATEGORY_IDS, placeCategory, type PlaceCategoryId } from '@/src/lib/placeCategories';

interface Props {
  onClose: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  PLACE_DUPLICATE: 'Ce lieu existe déjà à proximité.',
  PLACE_PENDING_LIMIT: 'Tu as déjà 5 propositions en attente de modération.',
  PLACE_RATE_LIMITED: 'Trop de propositions aujourd’hui, réessaie demain.',
};

/** Proposition d'un lieu culturel. Rien n'est publié avant modération. */
export const PlaceProposalDialog = ({ onClose }: Props) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategoryId>('centre_culturel');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [chosen, setChosen] = useState<PlaceSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const search = async (e: FormEvent) => {
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

  const canSubmit = name.trim().length >= 3 && Boolean(chosen) && !submitting;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!chosen || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/places', {
        name: name.trim(),
        category,
        ...(description.trim() ? { description: description.trim() } : {}),
        latitude: chosen.latitude,
        longitude: chosen.longitude,
      });
      setDone(true);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      setError(ERROR_MESSAGES[code] ?? 'Envoi impossible. Vérifie les champs puis réessaie.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog onClose={onClose} labelledBy="place-proposal-title" className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 rounded-3xl p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="place-proposal-title" className="text-lg font-black flex items-center gap-2"><MapPin className="w-5 h-5" aria-hidden /> Proposer un lieu</h2>
            <p className="text-xs text-zinc-500 mt-1 leading-5">Un lieu culturel ouvert au public (marché, centre, lieu de culte…). Il sera relu par la modération avant d’apparaître. N’indique jamais une adresse privée.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
        </div>

        {done ? (
          <div className="mt-6 text-center" role="status">
            <p className="font-black">Merci !</p>
            <p className="text-sm text-zinc-500 mt-1">Ta proposition est en attente de modération.</p>
            <button type="button" onClick={onClose} className="mt-5 w-full py-3 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black text-sm font-black">Fermer</button>
          </div>
        ) : (
          <>
            <form onSubmit={search} className="mt-4 flex gap-2">
              <input data-autofocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher le lieu sur la carte" aria-label="Rechercher le lieu sur la carte" className="flex-1 min-w-0 rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-sm outline-none" />
              <button type="submit" disabled={!query.trim() || searching} className="rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black px-4 py-2.5 text-xs font-black disabled:opacity-40">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Recherche" /> : 'Chercher'}
              </button>
            </form>
            {searchError && <p className="mt-2 text-xs text-red-600" role="alert">La recherche a échoué. Réessaie.</p>}
            {results.length > 0 && (
              <ul className="mt-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-900 max-h-40 overflow-y-auto" role="listbox" aria-label="Résultats">
                {results.map((r) => (
                  <li key={r.key}>
                    <button type="button" role="option" aria-selected={chosen?.key === r.key} onClick={() => { setChosen(r); if (!name.trim()) setName(r.label.split(',')[0] ?? ''); }} className={`w-full text-left px-3 py-2.5 text-sm ${chosen?.key === r.key ? 'bg-zinc-50 dark:bg-zinc-900 font-bold' : ''}`}>
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={submit} className="mt-4 space-y-3">
              <label className="block text-xs font-black">Nom du lieu
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="mt-1 w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-sm font-normal outline-none" />
              </label>
              <label className="block text-xs font-black">Catégorie
                <select value={category} onChange={(e) => setCategory(e.target.value as PlaceCategoryId)} className="mt-1 w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-sm font-normal outline-none">
                  {PLACE_CATEGORY_IDS.map((id) => <option key={id} value={id}>{placeCategory(id).icon} {placeCategory(id).label}</option>)}
                </select>
              </label>
              <label className="block text-xs font-black">Description (facultatif)
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} className="mt-1 w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-sm font-normal outline-none" />
              </label>
              {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
              <button type="submit" disabled={!canSubmit} className="w-full py-3 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black text-sm font-black disabled:opacity-40">
                {submitting ? 'Envoi…' : chosen ? `Proposer · ${chosen.label}` : 'Choisis d’abord le lieu sur la carte'}
              </button>
            </form>
          </>
        )}
      </div>
    </Dialog>
  );
};
