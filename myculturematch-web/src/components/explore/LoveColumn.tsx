import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, BookOpen, Check, Heart, MapPin, MessageCircle, RotateCcw, X } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';
import { chatService } from '@/src/services/chat.service';
import { loveService } from '@/src/services/loveService';
import { LoveActiveMatches } from '@/src/components/love/LoveActiveMatches';
import type { LoveMatch, LoveSearchQuota, LoveSearchResult } from '@/src/types/love';

type Role = 'user' | 'assistant';
type ChatMessage = { id: string; role: Role; content: string; criteria?: string[]; results?: LoveSearchResult[] };

const WELCOME =
  'Salut. Je vais t’aider à trouver des personnes qui correspondent vraiment à ce que tu recherches. Dis-moi simplement le type de personne que tu aimerais rencontrer.';

const LOVE_PROMPTS = [
  'Une femme entre 24 et 30 ans',
  'Quelqu’un qui partage mes valeurs et mes traditions',
  'Une personne proche de ma région avec qui voyager',
];

/** Phrases de recherche prêtes à dire à l'IA Love. */
const LOVE_SEARCH_PHRASES = [
  ...LOVE_PROMPTS,
  'Qui m’a aimé sur la plateforme ?',
  'Montre-moi mes matchs amoureux',
  'Aide-moi à écrire un premier message romantique',
];

const MatchCard: React.FC<{ match: LoveSearchResult; onLike: () => void; onPass: () => void; onChat: () => void }> = ({ match, onLike, onPass, onChat }) => {
  return (
    <motion.article layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
      <div className="relative aspect-[4/4.8] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {match.avatar ? <img src={match.avatar} alt={match.name} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-5xl font-semibold text-zinc-400">{match.name?.charAt(0)}</div>}
        <div className="absolute inset-x-3 top-3 flex justify-between gap-2">
          <span className="rounded-full bg-zinc-900/80 px-3 py-1.5 text-sm font-bold text-white backdrop-blur">{match.matchScore}%</span>
          {match.online && <span className="rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-zinc-700"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />En ligne</span>}
        </div>
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-white drop-shadow-lg">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-semibold">{match.name}, {match.age}</h3>
            <p className="flex items-center gap-1 text-sm opacity-90"><MapPin className="h-3.5 w-3.5" />{match.country || 'International'}</p>
          </div>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur">Top {match.rank}</span>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <p className="line-clamp-2 text-sm leading-6 text-zinc-500">{match.about || 'Profil culturellement ouvert et disponible pour faire connaissance.'}</p>
        <div className="space-y-2">{match.reasons.slice(0, 3).map((reason) => <div key={reason} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-200"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />{reason}</div>)}</div>
        <div className="grid grid-cols-3 gap-1.5">{[['Valeurs', match.breakdown.values], ['Culture', match.breakdown.culture], ['Intérêts', match.breakdown.interests]].map(([label, value]) => <div key={label as string} className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-2 text-center"><p className="text-sm font-semibold">{value}%</p><p className="text-[10px] text-zinc-500">{label}</p></div>)}</div>
        <div className="flex items-center gap-2">
          <button onClick={onPass} aria-label="Passer" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><X className="h-4 w-4" /></button>
          <button onClick={onLike} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-sm font-semibold text-white dark:text-zinc-900 hover:opacity-90 cursor-pointer"><Heart className="h-4 w-4 fill-current" />J’aime</button>
          <button onClick={onChat} aria-label="Ouvrir la conversation" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><MessageCircle className="h-4 w-4" /></button>
        </div>
      </div>
    </motion.article>
  );
};

const chipLabels = (criteria: Record<string, unknown>) => {
  const chips: string[] = [];
  if (typeof criteria.ageMin === 'number' || typeof criteria.ageMax === 'number') chips.push(`${criteria.ageMin ?? 18}–${criteria.ageMax ?? 100} ans`);
  if (Array.isArray(criteria.genders)) chips.push(criteria.genders.includes('female') ? 'Femme' : criteria.genders.includes('male') ? 'Homme' : 'Non-binaire');
  if (criteria.relationshipGoal === 'serious') chips.push('Relation sérieuse');
  if (criteria.relationshipGoal === 'casual') chips.push('Sans engagement');
  if (criteria.distanceKm) chips.push(`À moins de ${criteria.distanceKm} km`);
  if (Array.isArray(criteria.keywords)) chips.push(...criteria.keywords.slice(0, 5).map(String));
  return chips;
};

export const LoveColumn: React.FC = () => {
  const { openChat } = useUIStore();
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 'welcome', role: 'assistant', content: WELCOME }]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LoveSearchResult[]>([]);
  const [activeMatches, setActiveMatches] = useState<LoveMatch[]>([]);
  const [quota, setQuota] = useState<LoveSearchQuota>({ limit: 3, used: 0, remaining: 3 });
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [criteriaChips, setCriteriaChips] = useState<string[]>([]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [passed, setPassed] = useState<Record<string, boolean>>({});
  const [historyOpen, setHistoryOpen] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { Promise.all([loveService.getSearchQuota(), loveService.fetchActiveMatches()]).then(([q, matches]) => { setQuota(q); setActiveMatches(matches); }).catch(() => undefined); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, typing]);

  const send = async (text = query) => {
    const clean = text.trim();
    if (!clean || loading || quota.remaining <= 0) return;
    const history = [...messages.filter((m) => m.role === 'user').map((m) => m.content), clean];
    setQuery(''); setLoading(true); setTyping(true); setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'user', content: clean }]);
    try {
      const data = await loveService.conversation(history);
      const chips = data.criteria ? chipLabels(data.criteria) : [];
      setCriteriaChips(chips);
      if (data.results?.length) setResults(data.results);
      setQuota((q) => ({ ...q, used: q.limit - data.remainingSearches, remaining: data.remainingSearches }));
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: data.reply, criteria: chips, results: data.results }]);
    } catch (e) {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: e instanceof Error ? e.message : 'Je n’arrive pas à lancer cette recherche pour le moment.' }]);
    } finally { setTyping(false); setLoading(false); }
  };

  const like = async (id: string) => { try { await loveService.expressInterest(id); setLiked((v) => ({ ...v, [id]: true })); } catch (e) { setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: e instanceof Error ? e.message : 'Impossible d’envoyer ton intérêt.' }]); } };
  const pass = (id: string) => setPassed((v) => ({ ...v, [id]: true }));
  const openChatWith = async (id: string) => { try { await chatService.ensureConversationWith(id); } catch { /* chat can still open */ } openChat(); };
  const visibleResults = useMemo(() => results.filter((r) => !passed[r.id]), [results, passed]);
  const isWelcome = messages.length === 1;
  const history = messages.filter((m) => m.role === 'user');

  const newChat = () => {
    setMessages([{ id: 'welcome', role: 'assistant', content: WELCOME }]);
    setQuery('');
    setResults([]);
    setCriteriaChips([]);
    setPassed({});
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden px-4 pb-8 pt-4 lg:px-6">
      <section className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
        {/* Colonne centrale */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100">AI Love Chat</h1>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7">
            <div className="mx-auto max-w-3xl">
              {isWelcome && (
                <div className="py-10 text-center">
                  <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Welcome to AI Love Chat</h2>
                  <p className="mt-2 text-sm text-zinc-500">Get started with a task and chat can do the rest. Not sure where to start?</p>
                  <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
                    {LOVE_SEARCH_PHRASES.map((phrase) => (
                      <button key={phrase} onClick={() => send(phrase)} disabled={loading || quota.remaining <= 0} className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40">
                        {phrase}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div key={message.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100'}`}>
                      <p>{message.content}</p>
                      {message.criteria && message.criteria.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{message.criteria.map((c) => <span key={c} className="rounded-full bg-white/70 dark:bg-black/20 px-2.5 py-1 text-[11px] font-semibold">{c}</span>)}</div>}
                    </div>
                  </motion.div>
                ))}
                {typing && <div className="flex justify-start"><div className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3"><span className="inline-flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:120ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:240ms]" /></span></div></div>}
                {criteriaChips.length > 0 && <div className="flex flex-wrap gap-2 pl-2">{criteriaChips.map((c) => <span key={c} className="rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-500">{c}</span>)}</div>}
                {visibleResults.length > 0 && (
                  <div className="pt-3">
                    <div className="mb-4 flex items-end justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Sélection personnalisée</p>
                        <h2 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Les profils les plus pertinents</h2>
                      </div>
                      <button onClick={() => send('Propose-moi 4 autres personnes avec les mêmes critères')} disabled={loading || quota.remaining <= 0} className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer">
                        <RotateCcw className="h-3.5 w-3.5" /> Autres profils
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      {visibleResults.map((match) => <MatchCard key={match.id} match={match} onLike={() => like(match.id)} onPass={() => pass(match.id)} onChat={() => openChatWith(match.id)} />)}
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pb-4 pt-3 sm:px-7">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-2">
                <div className="flex items-end gap-2">
                  <textarea value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} rows={2} placeholder="Écris à propos de l’amour…" className="min-h-[52px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-zinc-800 dark:text-zinc-100 outline-none placeholder:text-zinc-400" />
                  <button onClick={() => send()} disabled={!query.trim() || loading || quota.remaining <= 0} className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white disabled:opacity-40 cursor-pointer">
                    <ArrowUp className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rail droit — uniquement l'historique, rétractable */}
        {historyOpen ? (
          <aside className="hidden w-72 shrink-0 flex-col border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 xl:flex">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">History</p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={newChat}
                  className="rounded-md border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-[11px] font-bold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  + New
                </button>
                <button
                  onClick={() => setHistoryOpen(false)}
                  title="Hide history"
                  className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto hide-scrollbar">
              {history.length === 0 ? (
                <p className="text-[11px] text-zinc-400">No conversation yet.</p>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setQuery(item.content)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-3 text-left text-xs text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                  >
                    <span className="line-clamp-2">{item.content}</span>
                    <MessageCircle className="h-4 w-4 shrink-0 text-zinc-400" />
                  </button>
                ))
              )}
            </div>
          </aside>
        ) : (
          <aside className="hidden w-12 shrink-0 flex-col items-center border-l border-zinc-200 dark:border-zinc-800 py-4 xl:flex">
            <button
              onClick={() => setHistoryOpen(true)}
              title="Show history"
              className="w-8 h-8 rounded-md flex items-center justify-center text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <BookOpen className="h-4 w-4" />
            </button>
          </aside>
        )}
      </section>

      {activeMatches.length > 0 && (
        <section className="mt-6">
          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tes connexions</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Matchs Love actifs</h2>
          </div>
          <LoveActiveMatches matches={activeMatches} setSelectedMatch={() => undefined} onOpenChat={(match) => openChatWith(match.id)} />
        </section>
      )}
      {Object.keys(liked).length > 0 && <p className="mt-4 text-center text-xs text-zinc-500">Ton intérêt a été envoyé. S’il est réciproque, votre connexion Love apparaîtra dans tes matchs actifs.</p>}
    </main>
  );
};
