import React, { useEffect, useMemo, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { api } from '@/src/services/api';

export type AudienceMode = 'default' | 'selected' | 'except';

interface Companion {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

interface Props {
  mode: AudienceMode;
  /** Appelé après enregistrement : le parent recharge ses réglages et son audience. */
  onSaved: () => void | Promise<void>;
}

const MODES: Array<{ value: AudienceMode; label: string; hint: string }> = [
  { value: 'default', label: 'Selon la visibilité choisie', hint: 'Aucune liste : la règle ci-dessus s’applique à tous.' },
  { value: 'selected', label: 'Ces personnes seulement', hint: 'Seuls les compagnons cochés voient ta position.' },
  { value: 'except', label: 'Tout le monde sauf…', hint: 'La visibilité ci-dessus s’applique, sauf aux compagnons cochés.' },
];

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase();

/**
 * Choix de l'audience de partage de position : mode + liste de compagnons.
 * La liste ne contient que des compagnons (le serveur le vérifie) ; « personne » reste prioritaire côté serveur.
 */
export const LocationAudienceSection: React.FC<Props> = ({ mode, onSaved }) => {
  const [draftMode, setDraftMode] = useState<AudienceMode>(mode);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setDraftMode(mode), [mode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, a] = await Promise.all([
          api.get<{ connections: Array<{ profile: Companion }> }>('/api/connections/companions'),
          api.get<{ members: Companion[] }>('/api/location/audience'),
        ]);
        if (cancelled) return;
        setCompanions((c.connections ?? []).map((x) => x.profile));
        setChosen(new Set((a.members ?? []).map((m) => m.id)));
      } catch {
        if (!cancelled) setError('Impossible de charger tes compagnons.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const usesList = draftMode !== 'default';
  const needsPeople = draftMode === 'selected' && chosen.size === 0;
  const dirty = useMemo(() => draftMode !== mode || usesList, [draftMode, mode, usesList]);

  const toggle = (id: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (usesList) await api.put('/api/location/audience', { memberIds: [...chosen] });
      await api.patch('/api/location/settings', { audienceMode: draftMode });
      await onSaved();
    } catch {
      setError('Enregistrement impossible. Réessaie.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-6" aria-labelledby="audience-title">
      <h3 id="audience-title" className="text-sm font-black">Qui voit ma position ?</h3>
      <p className="text-xs text-zinc-500 mt-1">Choisis des personnes précises parmi tes compagnons.</p>

      <div className="mt-3 space-y-2" role="radiogroup" aria-label="Audience de partage de position">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={draftMode === m.value}
            onClick={() => setDraftMode(m.value)}
            className={`w-full p-3 rounded-2xl border text-left ${draftMode === m.value ? 'border-zinc-950 dark:border-white bg-zinc-50 dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800'}`}
          >
            <b className="text-sm">{m.label}</b>
            <p className="text-xs text-zinc-500 mt-0.5">{m.hint}</p>
          </button>
        ))}
      </div>

      {usesList && (
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</div>
          ) : companions.length === 0 ? (
            <p className="text-xs text-zinc-500">Tu n’as pas encore de compagnon à choisir.</p>
          ) : (
            <ul className="max-h-56 overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-900">
              {companions.map((p) => {
                const on = chosen.has(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggle(p.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <span className="w-9 h-9 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-[11px] font-black shrink-0">
                        {p.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : initials(p.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold truncate">{p.name}</span>
                        <span className="block text-xs text-zinc-500 truncate">@{p.username}</span>
                      </span>
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${on ? 'bg-zinc-950 border-zinc-950 text-white dark:bg-white dark:border-white dark:text-black' : 'border-zinc-300 dark:border-zinc-700'}`}>
                        {on && <Check className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {needsPeople && !loading && companions.length > 0 && (
            <p className="mt-2 text-xs text-amber-600" role="status">Aucune personne cochée : personne ne verra ta position.</p>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600" role="alert">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving || !dirty}
        className="mt-4 w-full py-3 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black text-sm font-black disabled:opacity-40"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer l’audience'}
      </button>
    </section>
  );
};
