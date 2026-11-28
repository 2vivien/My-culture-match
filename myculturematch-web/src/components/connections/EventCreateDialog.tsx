import { useMemo, useState, type FormEvent } from 'react';
import { Loader2, CalendarPlus, X } from 'lucide-react';
import { api, ApiError } from '@/src/services/api';
import { Dialog } from '@/src/components/ui/Dialog';
import { searchPlaces, type PlaceSearchResult } from '@/src/lib/placeSearch';
import { placeCategory } from '@/src/lib/placeCategories';
import { eventErrorMessage, toIsoFromLocalInput } from '@/src/lib/eventForm';

export interface PickablePlace {
  id: string;
  name: string;
  category: string;
}

interface Props {
  /** Lieux culturels publiés déjà chargés sur la carte (seul choix possible pour un événement public). */
  places: PickablePlace[];
  onClose: () => void;
  onCreated: () => void;
}

/**
 * Création d'un événement. Public : lieu culturel déjà publié uniquement (jamais une adresse libre, pour qu'aucune
 * adresse privée ne soit offerte à tout le monde). Entre amis : un point libre, vu de tes compagnons seulement.
 * Les événements de tribu se créent depuis l'API (modérateurs).
 */
export const EventCreateDialog = ({ places, onClose, onCreated }: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsLocal, setStartsLocal] = useState('');
  const [endsLocal, setEndsLocal] = useState('');
  const [visibility, setVisibility] = useState<'friends' | 'public'>('friends');
  const [placeId, setPlaceId] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [point, setPoint] = useState<PlaceSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startsAt = useMemo(() => toIsoFromLocalInput(startsLocal), [startsLocal]);
  const endsAt = useMemo(() => toIsoFromLocalInput(endsLocal), [endsLocal]);
  const hasLocation = visibility === 'public' ? Boolean(placeId) : Boolean(point);
  const canSubmit = title.trim().length >= 3 && Boolean(startsAt) && hasLocation && !submitting;

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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !startsAt) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/events', {
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        startsAt,
        ...(endsAt ? { endsAt } : {}),
        visibility,
        ...(visibility === 'public' ? { placeId } : { point: { latitude: point!.latitude, longitude: point!.longitude, label: point!.label } }),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(eventErrorMessage(err instanceof ApiError ? err.code : ''));
    } finally {
      setSubmitting(false);
    }
  };

  const field = 'mt-1 w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-sm font-normal outline-none';

  return (
    <Dialog onClose={onClose} labelledBy="event-create-title" className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 rounded-3xl p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="event-create-title" className="text-lg font-black flex items-center gap-2"><CalendarPlus className="w-5 h-5" aria-hidden /> Créer un événement</h2>
            <p className="text-xs text-zinc-500 mt-1 leading-5">Public : dans un lieu culturel validé par la modération. Entre amis : n’importe où, vu de tes compagnons seulement.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-xs font-black">Titre
            <input data-autofocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} className={field} />
          </label>
          <label className="block text-xs font-black">Début
            <input type="datetime-local" value={startsLocal} onChange={(e) => setStartsLocal(e.target.value)} className={field} />
          </label>
          <label className="block text-xs font-black">Fin (facultatif)
            <input type="datetime-local" value={endsLocal} onChange={(e) => setEndsLocal(e.target.value)} className={field} />
          </label>

          <fieldset>
            <legend className="text-xs font-black">Qui peut le voir ?</legend>
            <div className="mt-1 flex gap-2" role="radiogroup" aria-label="Visibilité">
              {([['friends', 'Mes compagnons'], ['public', 'Tout le monde']] as const).map(([v, label]) => (
                <button key={v} type="button" role="radio" aria-checked={visibility === v} onClick={() => setVisibility(v)} className={`flex-1 py-2.5 rounded-2xl border text-xs font-black ${visibility === v ? 'border-zinc-950 dark:border-white bg-zinc-50 dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800'}`}>{label}</button>
              ))}
            </div>
          </fieldset>

          {visibility === 'public' ? (
            <label className="block text-xs font-black">Lieu culturel
              <select value={placeId} onChange={(e) => setPlaceId(e.target.value)} className={field}>
                <option value="">Choisir un lieu…</option>
                {places.map((p) => <option key={p.id} value={p.id}>{placeCategory(p.category).icon} {p.name}</option>)}
              </select>
              {places.length === 0 && <span className="block mt-1 text-[11px] font-normal text-zinc-500">Aucun lieu validé dans cette zone : déplace la carte ou propose un lieu.</span>}
            </label>
          ) : (
            <div>
              <div className="text-xs font-black">Lieu</div>
              <div className="mt-1 flex gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void search(e as unknown as FormEvent); }} placeholder="Ville, quartier ou lieu" aria-label="Rechercher le lieu" className="flex-1 min-w-0 rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-sm outline-none" />
                <button type="button" onClick={(e) => void search(e as unknown as FormEvent)} disabled={!query.trim() || searching} className="rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black px-4 py-2.5 text-xs font-black disabled:opacity-40">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Recherche" /> : 'Chercher'}
                </button>
              </div>
              {searchError && <p className="mt-2 text-xs text-red-600" role="alert">La recherche a échoué. Réessaie.</p>}
              {results.length > 0 && (
                <ul className="mt-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-900 max-h-36 overflow-y-auto" role="listbox" aria-label="Résultats">
                  {results.map((r) => (
                    <li key={r.key}>
                      <button type="button" role="option" aria-selected={point?.key === r.key} onClick={() => setPoint(r)} className={`w-full text-left px-3 py-2.5 text-sm ${point?.key === r.key ? 'bg-zinc-50 dark:bg-zinc-900 font-bold' : ''}`}>{r.label}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <label className="block text-xs font-black">Description (facultatif)
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={3} className={field} />
          </label>

          {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
          <button type="submit" disabled={!canSubmit} className="w-full py-3 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black text-sm font-black disabled:opacity-40">
            {submitting ? 'Création…' : 'Créer l’événement'}
          </button>
        </form>
      </div>
    </Dialog>
  );
};
