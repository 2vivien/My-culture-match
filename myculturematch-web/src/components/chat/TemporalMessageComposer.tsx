import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, LockKeyhole, Send, X } from 'lucide-react';
import { temporalMessageService } from '@/src/services/temporalMessageService';

interface Props {
  open: boolean;
  conversationId: string;
  partnerName: string;
  initialText?: string;
  onClose: () => void;
  onScheduled?: () => void;
}

function localInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export const TemporalMessageComposer: React.FC<Props> = ({ open, conversationId, partnerName, initialText = '', onClose, onScheduled }) => {
  const defaultReveal = useMemo(() => addMonths(new Date(), 6), [open]);
  const [text, setText] = useState(initialText);
  const [revealAt, setRevealAt] = useState(localInputValue(defaultReveal));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const date = addMonths(new Date(), 6);
    setText(initialText);
    setRevealAt(localInputValue(date));
    setError('');
  }, [open, initialText]);

  if (!open) return null;

  const setPreset = (kind: 'later-today' | 'tomorrow' | '3m' | '6m' | '1y') => {
    const now = new Date();
    if (kind === 'later-today') {
      const next = new Date(now);
      next.setHours(Math.min(now.getHours() + 2, 23), 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      setRevealAt(localInputValue(next));
      return;
    }
    if (kind === 'tomorrow') { setRevealAt(localInputValue(addDays(now, 1))); return; }
    if (kind === '3m') { setRevealAt(localInputValue(addMonths(now, 3))); return; }
    if (kind === '6m') { setRevealAt(localInputValue(addMonths(now, 6))); return; }
    setRevealAt(localInputValue(addMonths(now, 12)));
  };

  const dateLabel = new Date(revealAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });

  const schedule = async () => {
    setError('');
    if (!text.trim()) { setError('Écris ton message avant de le mettre dans le temps.'); return; }
    const date = new Date(revealAt);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now() + 30_000) { setError('Choisis une date et une heure dans le futur.'); return; }
    setSaving(true);
    try {
      await temporalMessageService.schedule(conversationId, { text: text.trim(), type: 'text', revealAt: date.toISOString() });
      onScheduled?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de programmer ce message.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Message temporel">
    <div className="w-full max-w-xl rounded-[28px] border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden">
      <div className="p-5 border-b border-app-border dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#8B4A2B]/10 text-[#8B4A2B] flex items-center justify-center"><Clock3 className="w-5 h-5" /></div>
          <div><h2 className="font-bold text-base">Message temporel</h2><p className="text-xs text-app-gray">Écrire aujourd'hui pour être lu plus tard</p></div>
        </div>
        <button type="button" onClick={onClose} className="w-9 h-9 rounded-full border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-gray"><X className="w-4 h-4" /></button>
      </div>

      <div className="p-5 space-y-4">
        <div className="rounded-2xl border border-[#8B4A2B]/20 bg-[#8B4A2B]/5 p-4 flex gap-3">
          <LockKeyhole className="w-4 h-4 mt-0.5 text-[#8B4A2B] shrink-0" />
          <div><p className="text-xs font-bold">{partnerName} ne verra pas le contenu avant la date choisie.</p><p className="text-[11px] text-app-gray mt-1">Une notification peut indiquer qu'un message temporel attend, mais son contenu reste verrouillé jusqu'au jour J.</p></div>
        </div>

        <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={7} maxLength={12000} placeholder="Écris ce que tu veux laisser à ton futur toi et à cette personne…" className="w-full rounded-2xl border border-app-border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 text-sm outline-none resize-none" />

        <div>
          <p className="text-xs font-bold mb-2">Quand doit-il apparaître ?</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <button type="button" onClick={() => setPreset('later-today')} className="rounded-full border border-app-border dark:border-zinc-800 px-3 py-1.5 text-xs">Plus tard aujourd'hui</button>
            <button type="button" onClick={() => setPreset('tomorrow')} className="rounded-full border border-app-border dark:border-zinc-800 px-3 py-1.5 text-xs">Demain</button>
            <button type="button" onClick={() => setPreset('3m')} className="rounded-full border border-app-border dark:border-zinc-800 px-3 py-1.5 text-xs">3 mois</button>
            <button type="button" onClick={() => setPreset('6m')} className="rounded-full border border-app-border dark:border-zinc-800 px-3 py-1.5 text-xs">6 mois</button>
            <button type="button" onClick={() => setPreset('1y')} className="rounded-full border border-app-border dark:border-zinc-800 px-3 py-1.5 text-xs">1 an</button>
          </div>
          <input type="datetime-local" value={revealAt} onChange={(e) => setRevealAt(e.target.value)} className="w-full rounded-2xl border border-app-border dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm" />
          <p className="text-[11px] text-app-gray mt-2">Il sera révélé le {dateLabel}.</p>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button type="button" onClick={() => void schedule()} disabled={saving || !text.trim()} className="w-full rounded-2xl bg-[#8B4A2B] text-white py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          <Send className="w-4 h-4" />
          {saving ? 'Le temps est en train de garder ton message…' : 'Garder ce message dans le temps'}
        </button>
      </div>
    </div>
  </div>;
};
