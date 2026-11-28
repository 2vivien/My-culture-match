import { useEffect, useState } from 'react';
import { Flag } from 'lucide-react';
import { api, ApiError } from '@/src/services/api';
import { PLACE_REPORT_REASONS, placeReportError, placeReportPayload, type PlaceReportReasonId } from '@/src/lib/placeReport';

interface Props {
  placeId: string;
}

/** « Signaler ce lieu » : choix d'un motif puis envoi. Trois signalements distincts masquent le lieu jusqu'à relecture. */
export const PlaceReportButton = ({ placeId }: Props) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<PlaceReportReasonId>('private_address');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // La fiche reste montée quand on passe d'un lieu à l'autre : on repart de zéro.
  useEffect(() => {
    setOpen(false);
    setDone(false);
    setError(null);
  }, [placeId]);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      await api.post('/api/reports', placeReportPayload(placeId, reason));
      setDone(true);
    } catch (err) {
      setError(placeReportError(err instanceof ApiError ? err.code : ''));
    } finally {
      setSending(false);
    }
  };

  if (done) return <p className="mt-3 text-xs font-bold text-emerald-700 dark:text-emerald-300" role="status">Merci : la modération va examiner ce lieu.</p>;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-zinc-500 hover:text-red-600">
        <Flag className="w-3.5 h-3.5" aria-hidden /> Signaler ce lieu
      </button>
    );
  }

  return (
    <fieldset className="mt-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3">
      <legend className="px-1 text-xs font-black">Pourquoi signaler ce lieu ?</legend>
      <div className="space-y-1.5" role="radiogroup" aria-label="Motif du signalement">
        {PLACE_REPORT_REASONS.map((r) => (
          <button key={r.id} type="button" role="radio" aria-checked={reason === r.id} onClick={() => setReason(r.id)} className={`w-full text-left rounded-xl border px-3 py-2 ${reason === r.id ? 'border-zinc-950 dark:border-white bg-zinc-50 dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800'}`}>
            <span className="block text-xs font-black">{r.label}</span>
            <span className="block text-[11px] text-zinc-500">{r.hint}</span>
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-600" role="alert">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={send} disabled={sending} className="flex-1 py-2.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-black text-xs font-black disabled:opacity-40">{sending ? 'Envoi…' : 'Envoyer le signalement'}</button>
        <button type="button" onClick={() => setOpen(false)} disabled={sending} className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-black">Annuler</button>
      </div>
    </fieldset>
  );
};
