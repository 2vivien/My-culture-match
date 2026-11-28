import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Check, Heart, MapPin, MessageCircle, RotateCcw, Search, Settings2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';
import { chatService } from '@/src/services/chat.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { loveService, type LoveProfileResponse } from '@/src/services/loveService';
import { ApiError } from '@/src/services/api';
import { LoveActiveMatches } from '@/src/components/love/LoveActiveMatches';
import { LoveOnboarding } from '@/src/components/love/LoveOnboarding';
import type { LoveMatch, LoveSearchQuota, LoveSearchResult } from '@/src/types/love';
import { isQuotaExhausted } from '@/src/lib/loveQuota';

const WELCOME = 'Salut. Je vais t’aider à trouver des personnes qui correspondent vraiment à ce que tu recherches. Dis-moi simplement le type de personne que tu aimerais rencontrer.';

type Role = 'user' | 'assistant';
type ChatMessage = { id: string; role: Role; content: string; criteria?: string[]; results?: LoveSearchResult[] };

const QUICK_PROMPTS = [
  'Une femme entre 24 et 30 ans',
  'Quelqu’un de sérieux et ouvert d’esprit',
  'Une personne proche de ma région qui aime voyager',
];

const MatchCard: React.FC<{ match: LoveSearchResult; liked: boolean; onLike: () => void; onPass: () => void; onProfile: () => void }> = ({ match, liked, onLike, onPass, onProfile }) => {
  return (
    <motion.article layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[28px] border border-app-border bg-app-card shadow-sm">
      <div role="button" tabIndex={0} aria-label={`Voir le profil de ${match.name}`} onClick={onProfile} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onProfile(); }} className="relative aspect-[4/4.8] cursor-pointer overflow-hidden bg-app-muted">
        {match.avatar ? <img src={match.avatar} alt={match.name} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-5xl font-semibold text-app-gray">{match.name?.charAt(0)}</div>}
        <div className="absolute inset-x-3 top-3 flex justify-between gap-2"><span className="rounded-full bg-black/70 px-3 py-1.5 text-sm font-bold text-white backdrop-blur">{match.matchScore}%</span>{match.online && <span className="rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-gray-800"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />En ligne</span>}</div>
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-white drop-shadow-lg"><div className="min-w-0"><h3 className="truncate text-xl font-semibold">{match.name}, {match.age}</h3><p className="flex items-center gap-1 text-sm opacity-90"><MapPin className="h-3.5 w-3.5" />{match.country || 'International'}</p></div><span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur">Top {match.rank}</span></div>
      </div>
      <div className="space-y-4 p-4"><p className="line-clamp-2 text-sm leading-6 text-app-gray">{match.about || 'Profil culturellement ouvert et disponible pour faire connaissance.'}</p><div className="space-y-2">{match.reasons.slice(0, 3).map((reason) => <div key={reason} className="flex items-start gap-2 text-xs text-app-text"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{reason}</div>)}</div><div className="grid grid-cols-3 gap-1.5">{[['Valeurs', match.breakdown.values], ['Culture', match.breakdown.culture], ['Intérêts', match.breakdown.interests]].map(([label, value]) => <div key={label as string} className="rounded-xl bg-app-muted p-2 text-center"><p className="text-sm font-semibold">{value}%</p><p className="text-[10px] text-app-gray">{label}</p></div>)}</div><div className="flex items-center gap-2"><button onClick={onPass} aria-label="Passer" className="flex h-10 w-10 items-center justify-center rounded-full border border-app-border text-app-gray hover:bg-app-muted"><X className="h-4 w-4" /></button><button onClick={onLike} disabled={liked} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#8B4A2B] text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"><Heart className="h-4 w-4 fill-current" />{liked ? 'Requête envoyée' : 'Envoyer une requête'}</button><button onClick={onProfile} aria-label="Voir le profil" className="flex h-10 w-10 items-center justify-center rounded-full border border-app-border text-app-text hover:bg-app-muted"><MessageCircle className="h-4 w-4" /></button></div></div>
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

const LOVE_PROFILE_KEY = ['love', 'profile'] as const;

export const LoveColumn: React.FC = () => {
  const { setActiveTab, openLoveChat } = useUIStore();
  const { setSelectedProfileUserId } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 'welcome', role: 'assistant', content: WELCOME }]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LoveSearchResult[]>([]);
  const [activeMatches, setActiveMatches] = useState<LoveMatch[]>([]);
  const [quota, setQuota] = useState<LoveSearchQuota>({ limit: 20, used: 0, remaining: 20 });
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [criteriaChips, setCriteriaChips] = useState<string[]>([]);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [passed, setPassed] = useState<Record<string, boolean>>({});
  const endRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState(false);
  // Questionnaire Love en cache React Query : invalidé après chaque enregistrement.
  const profileQuery = useQuery({ queryKey: LOVE_PROFILE_KEY, queryFn: () => loveService.getProfile(), staleTime: 5 * 60_000, retry: false });
  // null = inconnu (chargement), false = questionnaire à faire, true = profil Love complété (erreur : on n'enferme pas la personne)
  const profileDone: boolean | null = profileQuery.isError ? true : profileQuery.data ? profileQuery.data.completed : null;
  const onProfileSaved = async (saved?: LoveProfileResponse) => {
    if (saved) queryClient.setQueryData(LOVE_PROFILE_KEY, saved);
    await queryClient.invalidateQueries({ queryKey: LOVE_PROFILE_KEY });
    if (editingProfile) {
      setEditingProfile(false);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: `C’est enregistré : j’utiliserai tes nouvelles préférences pour tes prochaines recherches.${saved?.notice ? ` ${saved.notice}` : ''}` }]);
    }
  };
  useEffect(() => { Promise.all([loveService.getSearchQuota(), loveService.fetchActiveMatches()]).then(([q, matches]) => { setQuota(q); setActiveMatches(matches); }).catch(() => undefined); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, typing]);

  const send = async (text = query) => {
    const clean = text.trim();
    if (!clean || loading || isQuotaExhausted(quota)) return;
    const history = [...messages.filter((m) => m.role === 'user').map((m) => m.content), clean];
    setQuery(''); setLoading(true); setTyping(true); setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'user', content: clean }]);
    try {
      const data = await loveService.conversation(history);
      const chips = data.criteria ? chipLabels(data.criteria) : [];
      setCriteriaChips(chips);
      if (data.results?.length) setResults(data.results);
      setQuota((q) => (data.remainingSearches < 0 ? { ...q, remaining: -1, unlimited: true } : { ...q, used: q.limit - data.remainingSearches, remaining: data.remainingSearches }));
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: data.reply, criteria: chips, results: data.results }]);
    } catch (e) {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: e instanceof Error ? e.message : 'Je n’arrive pas à lancer cette recherche pour le moment.' }]);
    } finally { setTyping(false); setLoading(false); }
  };

  const like = async (id: string) => { try { await loveService.expressInterest(id); setLiked((v) => ({ ...v, [id]: true })); } catch (e) { setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: e instanceof Error ? e.message : 'Impossible d’envoyer ton intérêt.' }]); } };
  const pass = (id: string) => setPassed((v) => ({ ...v, [id]: true }));
  const openChatWith = async (id: string, alreadyMatched = false) => {
    if (alreadyMatched) { openLoveChat(); return; }
    try {
      const conversation = await chatService.ensureConversationWith(id);
      openLoveChat(conversation.id);
    } catch (e) {
      const content = e instanceof ApiError && e.code === 'CONTACT_CONSENT_REQUIRED'
        ? 'Cette personne n’accepte pas encore les messages directs. Envoie-lui d’abord ton intérêt avec « J’aime » : si elle te répond, la conversation s’ouvrira.'
        : e instanceof Error ? e.message : 'Impossible d’ouvrir la conversation pour le moment.';
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content }]);
    }
  };
  const visibleResults = useMemo(() => results.filter((r) => !passed[r.id]), [results, passed]);
  const lastResultsId = useMemo(() => [...messages].reverse().find((m) => m.results?.length)?.id, [messages]);

  /** Ouvre le profil complet de la personne proposée (pas de conversation sans acceptation). */
  const openProfile = (id: string) => { setSelectedProfileUserId(id); setActiveTab('Totem'); };

  /** Sélection de profils rendue comme faisant partie de la conversation avec l'IA. */
  const renderCards = (message: ChatMessage) => {
    const cards = (message.results ?? []).filter((r) => !passed[r.id]);
    if (!cards.length) return null;
    const isLast = message.id === lastResultsId;
    return (
      <div className="pl-2 pt-1">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((match) => <MatchCard key={match.id} match={match} liked={Boolean(liked[match.id])} onLike={() => like(match.id)} onPass={() => pass(match.id)} onProfile={() => openProfile(match.id)} />)}
        </div>
        {isLast && visibleResults.length > 0 && (
          <button onClick={() => send('Propose-moi 4 autres personnes avec les mêmes critères')} disabled={loading || isQuotaExhausted(quota)} className="mt-4 flex items-center gap-1.5 rounded-full border border-app-border px-3 py-2 text-xs font-semibold text-app-gray hover:text-app-text disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />Autres profils</button>
        )}
      </div>
    );
  };

  // Première utilisation de Love : questionnaire en discussion avant toute recherche.
  if (profileDone === null) return null;
  if (profileDone === false) return <LoveOnboarding onDone={onProfileSaved} />;
  if (editingProfile) return <LoveOnboarding initialAnswers={profileQuery.data?.answers ?? null} onDone={onProfileSaved} onCancel={() => setEditingProfile(false)} />;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden px-4 pb-8 pt-4 lg:px-6">
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-app-border bg-app-card shadow-sm">
        <header className="shrink-0 border-b border-app-border px-5 py-4 sm:px-7"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8B4A2B]/10 text-[#8B4A2B]"><Sparkles className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B4A2B]">Love AI</p><h1 className="text-lg font-semibold text-app-text">Matchmaking conversationnel</h1></div></div><div className="flex items-center gap-3 text-xs text-app-gray"><span>{quota.remaining < 0 ? 'Recherches illimitées' : `${quota.remaining}/${quota.limit} recherches aujourd’hui`}</span><button type="button" onClick={() => setEditingProfile(true)} className="flex items-center gap-1.5 rounded-full border border-app-border px-3 py-1.5 font-semibold text-app-text hover:bg-app-muted"><Settings2 className="h-3.5 w-3.5" />Modifier mes préférences Love</button><ShieldCheck className="h-4 w-4" /></div></div></header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7"><div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => <React.Fragment key={message.id}><motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-[24px] px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-md bg-[#8B4A2B] text-white' : 'rounded-bl-md bg-app-muted text-app-text'}`}><p>{message.content}</p>{message.criteria && message.criteria.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{message.criteria.map((c) => <span key={c} className="rounded-full border border-current/10 bg-white/60 px-2.5 py-1 text-[11px] font-semibold text-app-text dark:bg-black/10">{c}</span>)}</div>}</div></motion.div>{renderCards(message)}</React.Fragment>)}
          {typing && <div className="flex justify-start"><div className="rounded-[24px] rounded-bl-md bg-app-muted px-4 py-3"><span className="inline-flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-gray" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-gray [animation-delay:120ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-app-gray [animation-delay:240ms]" /></span></div></div>}
          {criteriaChips.length > 0 && <div className="flex flex-wrap gap-2 pl-2">{criteriaChips.map((c) => <span key={c} className="rounded-full border border-app-border bg-app-bg px-3 py-1.5 text-xs font-medium text-app-gray">{c}</span>)}</div>}
          <div ref={endRef} />
        </div></div>
        <div className="shrink-0 border-t border-app-border bg-app-card/95 px-4 pb-4 pt-3 backdrop-blur sm:px-7"><div className="mx-auto max-w-3xl"><div className="mb-2 flex gap-2 overflow-x-auto pb-1">{QUICK_PROMPTS.map((prompt) => <button key={prompt} onClick={() => send(prompt)} disabled={loading || isQuotaExhausted(quota)} className="shrink-0 rounded-full border border-app-border bg-app-bg px-3 py-1.5 text-xs text-app-gray hover:border-[#8B4A2B]/50 hover:text-app-text disabled:opacity-40">{prompt}</button>)}</div><div className="rounded-[24px] border border-app-border bg-app-bg p-2 shadow-sm"><div className="flex items-end gap-2"><textarea value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} rows={2} placeholder="Dis-moi ce que tu recherches…" className="min-h-[56px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-app-text outline-none placeholder:text-app-gray" /><button onClick={() => send()} disabled={!query.trim() || loading || isQuotaExhausted(quota)} className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8B4A2B] text-white disabled:opacity-40"><ArrowUp className="h-5 w-5" /></button></div></div><p className="mt-2 text-center text-[11px] text-app-gray">Entrée pour envoyer · Maj+Entrée pour aller à la ligne · consentement et blocages toujours respectés</p></div></div>
      </section>
      {activeMatches.length > 0 && <section className="mt-6"><div className="mb-3"><p className="text-xs font-bold uppercase tracking-wider text-[#8B4A2B]">Tes connexions</p><h2 className="mt-1 text-xl font-semibold text-app-text">Matchs Love actifs</h2></div><LoveActiveMatches matches={activeMatches} setSelectedMatch={() => undefined} onOpenChat={(match) => openChatWith(match.id, true)} /></section>}
      {Object.keys(liked).length > 0 && <p className="mt-4 text-center text-xs text-app-gray">Ton intérêt a été envoyé. S’il est réciproque, votre connexion Love apparaîtra dans tes matchs actifs.</p>}
    </main>
  );
};
