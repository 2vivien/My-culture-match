import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { loveService, type LoveProfileAnswers, type LoveProfileResponse } from '@/src/services/loveService';

/**
 * Questionnaire de première utilisation de Love, présenté comme une discussion avec l'IA :
 * 6 questions maximum, une seule fois, modifiables ensuite.
 */

type Step =
  | { key: keyof LoveProfileAnswers; kind: 'single'; question: string; options: Record<string, string> }
  | { key: keyof LoveProfileAnswers; kind: 'multi'; question: string; min: number; max: number; options: Record<string, string> }
  | { key: 'understood'; kind: 'text'; question: string };

const STEPS: Step[] = [
  { key: 'goals', kind: 'multi', min: 1, max: 4, question: 'Qu’est-ce que tu recherches en ce moment ?', options: { serious: 'Une relation sérieuse', progressive: 'Apprendre à se connaître', open: 'Une relation ouverte, à définir', intercultural: 'Une rencontre interculturelle avant tout' } },
  { key: 'relationship', kind: 'single', question: 'Quel type de relation aimerais-tu construire ?', options: { serious: 'Sérieux / long terme', casual: 'Sans engagement', slow: 'Je veux prendre mon temps', unsure: 'Je ne sais pas encore' } },
  { key: 'values', kind: 'multi', min: 3, max: 5, question: 'Quelles sont tes valeurs les plus importantes ? (3 à 5)', options: { respect: 'Respect', honesty: 'Honnêteté', fidelity: 'Fidélité', freedom: 'Liberté', family: 'Famille', ambition: 'Ambition', curiosity: 'Curiosité', spirituality: 'Spiritualité', humor: 'Humour', stability: 'Stabilité', adventure: 'Aventure', empathy: 'Empathie', communication: 'Communication', independence: 'Indépendance', creativity: 'Créativité' } },
  { key: 'lifestyle', kind: 'multi', min: 5, max: 8, question: 'Quel style de vie te ressemble ? (5 à 8)', options: { travel: 'Voyage', music: 'Musique', sport: 'Sport', cooking: 'Cuisine', reading: 'Lecture', art: 'Art', entrepreneurship: 'Entrepreneuriat', technology: 'Technologie', nature: 'Nature', 'going-out': 'Sorties', games: 'Jeux', cinema: 'Cinéma', learning: 'Apprentissage', family: 'Famille', culture: 'Culture', languages: 'Langues' } },
  { key: 'distance', kind: 'single', question: 'Quelle distance est confortable pour toi ?', options: { city: 'Même ville', km25: '25 km', km50: '50 km', km100: '100 km', country: 'Même pays', international: 'International' } },
  { key: 'understood', kind: 'text', question: 'Dernière question, libre : qu’est-ce qui te fait te sentir réellement compris(e) par quelqu’un ?' },
];

interface Props {
  onDone: (saved?: LoveProfileResponse) => void;
  /** Réponses déjà enregistrées : active le mode « modification », questionnaire pré-rempli. */
  initialAnswers?: LoveProfileAnswers | null;
  /** Mode modification : permet de quitter sans rien changer. */
  onCancel?: () => void;
}

/** Sélection / texte pré-remplis d'une étape à partir des réponses déjà enregistrées. */
function prefill(step: Step, initial?: LoveProfileAnswers | null): { selection: string[]; text: string } {
  const value = initial?.[step.key];
  if (step.kind === 'text') return { selection: [], text: typeof value === 'string' ? value : '' };
  return { selection: Array.isArray(value) ? value : typeof value === 'string' ? [value] : [], text: '' };
}

export const LoveOnboarding: React.FC<Props> = ({ onDone, initialAnswers, onCancel }) => {
  const editing = Boolean(initialAnswers);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<keyof LoveProfileAnswers, unknown>>>({});
  const [selection, setSelection] = useState<string[]>(() => prefill(STEPS[0]!, initialAnswers).selection);
  const [text, setText] = useState(() => prefill(STEPS[0]!, initialAnswers).text);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const step = STEPS[index]!;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [index, selection]);

  const history = useMemo(() => STEPS.slice(0, index).map((s) => {
    const value = answers[s.key];
    const label = s.kind === 'text'
      ? (typeof value === 'string' && value ? value : 'Je préfère passer')
      : (Array.isArray(value) ? value : [value]).map((v) => (s as { options: Record<string, string> }).options[String(v)] ?? String(v)).join(', ');
    return { question: s.question, label };
  }), [answers, index]);

  const finish = async (final: Partial<Record<keyof LoveProfileAnswers, unknown>>) => {
    setSaving(true); setError(null);
    try { const saved = await loveService.saveProfile(final as LoveProfileAnswers); onDone(saved); }
    catch (e) { setError(e instanceof Error ? e.message : 'Impossible d’enregistrer tes réponses.'); setSaving(false); }
  };

  const advance = (value: unknown) => {
    const next = { ...answers, [step.key]: value };
    if (step.kind === 'text' && !value) delete next[step.key];
    setAnswers(next);
    if (index === STEPS.length - 1) { void finish(next); return; }
    const following = prefill(STEPS[index + 1]!, initialAnswers);
    setSelection(following.selection); setText(following.text); setIndex(index + 1);
  };

  const toggle = (option: string) => {
    if (step.kind !== 'multi') return;
    setSelection((cur) => cur.includes(option) ? cur.filter((o) => o !== option) : cur.length < step.max ? [...cur, option] : cur);
  };

  return (
    <main className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 py-6">
      <header className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E27D60]/10 text-[#E27D60]"><Sparkles className="h-5 w-5" /></div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#E27D60]">Love AI</p>
          <h1 className="text-lg font-semibold text-app-text">{editing ? 'Modifier mes préférences Love' : 'Faisons connaissance'} ({index + 1}/{STEPS.length})</h1>
        </div>
        {editing && onCancel && <button type="button" disabled={saving} onClick={onCancel} className="ml-auto rounded-full border border-app-border px-4 py-1.5 text-xs font-semibold text-app-gray disabled:opacity-40">Annuler</button>}
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        <Bubble role="assistant">{editing ? 'Voici tes réponses actuelles : garde-les ou change-les, rien n’est enregistré avant la dernière question.' : 'Avant ta première recherche, j’ai quelques questions pour mieux te comprendre. Tu pourras tout modifier ensuite.'}</Bubble>
        {history.map((h) => (
          <React.Fragment key={h.question}>
            <Bubble role="assistant">{h.question}</Bubble>
            <Bubble role="user">{h.label}</Bubble>
          </React.Fragment>
        ))}
        <Bubble role="assistant">{step.question}</Bubble>
        {step.kind !== 'text' && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(step.options).map(([value, label]) => {
              const active = selection.includes(value);
              return (
                <button key={value} type="button" disabled={saving}
                  onClick={() => (step.kind === 'single' ? advance(value) : toggle(value))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? 'border-[#E27D60] bg-[#E27D60] text-white' : 'border-app-border text-app-text hover:border-[#E27D60]/60'}`}>
                  {label}
                </button>
              );
            })}
          </div>
        )}
        {step.kind === 'multi' && (
          <button type="button" disabled={saving || selection.length < step.min}
            onClick={() => advance(selection)}
            className="rounded-full bg-[#E27D60] px-5 py-2 text-xs font-bold text-white disabled:opacity-40">
            Valider{selection.length > 0 ? ` (${selection.length}/${step.max})` : ''}
          </button>
        )}
        {step.kind === 'text' && (
          <div className="space-y-2">
            <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={3} placeholder="Ta réponse (facultative)…"
              className="w-full resize-none rounded-2xl border border-app-border bg-app-bg p-3 text-sm text-app-text outline-none" />
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={() => advance(text.trim())} className="rounded-full bg-[#E27D60] px-5 py-2 text-xs font-bold text-white disabled:opacity-40">{saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Terminer'}</button>
              <button type="button" disabled={saving} onClick={() => advance('')} className="rounded-full border border-app-border px-5 py-2 text-xs font-semibold text-app-gray">Passer</button>
            </div>
          </div>
        )}
        {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
        <div ref={endRef} />
      </div>
    </main>
  );
};

const Bubble: React.FC<{ role: 'assistant' | 'user'; children: React.ReactNode }> = ({ role, children }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[88%] rounded-[24px] px-4 py-3 text-sm leading-6 ${role === 'user' ? 'rounded-br-md bg-[#E27D60] text-white' : 'rounded-bl-md bg-app-muted text-app-text'}`}>{children}</div>
  </motion.div>
);
