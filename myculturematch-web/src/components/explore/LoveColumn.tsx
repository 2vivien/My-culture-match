import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Heart, MessageCircle, Search, Sparkles, SlidersHorizontal, X, Check, MapPin, ShieldCheck } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';
import { chatService } from '@/src/services/chat.service';
import { loveService } from '@/src/services/loveService';
import { LoveActiveMatches } from '@/src/components/love/LoveActiveMatches';
import type { LoveMatch, LoveSearchQuota, LoveSearchResult } from '@/src/types/love';

const QUICK_PROMPTS = [
  'Une femme entre 24 et 30 ans, ouverte d’esprit, qui aime voyager et cherche une relation sérieuse',
  'Quelqu’un de sérieux, curieux, avec une forte ouverture culturelle',
  'Une personne proche de ma région, avec des valeurs compatibles',
];

function MatchCard({ match, onLike, onPass, onChat }: { match: LoveSearchResult; onLike: () => void; onPass: () => void; onChat: () => void }) {
  return (
    <motion.article layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="group overflow-hidden rounded-3xl border border-app-border bg-app-card shadow-sm">
      <div className="relative aspect-[4/4.7] overflow-hidden bg-app-muted">
        {match.avatar ? <img src={match.avatar} alt={match.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-5xl font-semibold text-app-gray">{match.name?.charAt(0)}</div>}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          <span className="rounded-full bg-black/65 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">{match.matchScore}%</span>
          {match.online && <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1.5 text-xs font-medium text-gray-800"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />En ligne</span>}
        </div>
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <div className="min-w-0 text-white drop-shadow-lg"><h3 className="truncate text-xl font-semibold">{match.name}, {match.age}</h3><p className="flex items-center gap-1 text-sm opacity-90"><MapPin className="h-3.5 w-3.5" />{match.country || 'International'}</p></div>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">Top {match.rank}</span>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <p className="line-clamp-2 text-sm leading-6 text-app-gray">{match.about || 'Profil culturellement ouvert et disponible pour faire connaissance.'}</p>
        <div className="space-y-2">{match.reasons.slice(0, 3).map((reason) => <div key={reason} className="flex items-start gap-2 text-xs text-app-text"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{reason}</div>)}</div>
        <div className="grid grid-cols-3 gap-1.5">{[['Valeurs', match.breakdown.values], ['Culture', match.breakdown.culture], ['Intérêts', match.breakdown.interests]].map(([label, value]) => <div key={label as string} className="rounded-xl bg-app-muted p-2 text-center"><p className="text-sm font-semibold">{value}%</p><p className="text-[10px] text-app-gray">{label}</p></div>)}</div>
        <div className="flex items-center gap-2">
          <button onClick={onPass} aria-label="Passer" className="flex h-10 w-10 items-center justify-center rounded-full border border-app-border text-app-gray transition hover:bg-app-muted"><X className="h-4 w-4" /></button>
          <button onClick={onLike} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#E27D60] text-sm font-semibold text-white transition hover:opacity-90"><Heart className="h-4 w-4 fill-current" />J’aime</button>
          <button onClick={onChat} aria-label="Ouvrir la conversation" className="flex h-10 w-10 items-center justify-center rounded-full border border-app-border text-app-text transition hover:bg-app-muted"><MessageCircle className="h-4 w-4" /></button>
        </div>
      </div>
    </motion.article>
  );
}

export const LoveColumn: React.FC = () => {
  const { openChat } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LoveSearchResult[]>([]);
  const [activeMatches, setActiveMatches] = useState<LoveMatch[]>([]);
  const [quota, setQuota] = useState<LoveSearchQuota>({ limit: 3, used: 0, remaining: 3 });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [passed, setPassed] = useState<Record<string, boolean>>({});
  const [selectedActive, setSelectedActive] = useState<LoveMatch | null>(null);

  useEffect(() => {
    Promise.all([loveService.getSearchQuota(), loveService.fetchActiveMatches()]).then(([q, matches]) => { setQuota(q); setActiveMatches(matches); }).catch(() => undefined);
  }, []);

  const search = async (text = query) => {
    const clean = text.trim(); if (!clean || loading || quota.remaining <= 0) return;
    setLoading(true); setError(null); setQuery(clean);
    try { const data = await loveService.search(clean); setResults(data.results); setQuota((q) => ({ ...q, used: q.limit - data.remainingSearches, remaining: data.remainingSearches })); setSearched(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Impossible de lancer la recherche pour le moment.'); }
    finally { setLoading(false); }
  };
  const like = async (id: string) => { try { await loveService.expressInterest(id); setLiked((v) => ({ ...v, [id]: true })); } catch (e) { setError(e instanceof Error ? e.message : 'Impossible d’envoyer ton intérêt.'); } };
  const openChatWith = async (id: string) => { try { await chatService.ensureConversationWith(id); } catch { /* ouverture non bloquante */ } openChat(); };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-y-auto px-4 pb-16 pt-4 lg:px-6">
      <section className="relative overflow-hidden rounded-[32px] border border-app-border bg-app-card">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#E27D60]/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-5 py-10 text-center sm:px-8 sm:py-14">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E27D60]/10 text-[#E27D60]"><Sparkles className="h-6 w-6" /></div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#E27D60]">Love Matchmaking</p>
          <h1 className="text-3xl font-semibold tracking-tight text-app-text sm:text-4xl">Dis-moi qui tu recherches.</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-app-gray sm:text-base">Décris simplement la personne que tu aimerais rencontrer. Je te propose seulement les 4 profils les plus pertinents.</p>
          <div className="mx-auto mt-7 rounded-2xl border border-app-border bg-app-bg p-2 shadow-sm"><div className="flex items-end gap-2"><textarea value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') search(); }} rows={2} placeholder="Ex. Une femme entre 24 et 30 ans, ouverte d’esprit, aime voyager et cherche une relation sérieuse…" className="min-h-[76px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-app-text outline-none placeholder:text-app-gray" /><button onClick={() => search()} disabled={!query.trim() || loading || quota.remaining <= 0} className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E27D60] text-white disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="h-5 w-5" /></button></div></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">{QUICK_PROMPTS.map((prompt) => <button key={prompt} onClick={() => search(prompt)} disabled={loading || quota.remaining <= 0} className="rounded-full border border-app-border bg-app-bg px-3 py-2 text-xs text-app-gray transition hover:border-[#E27D60]/50 hover:text-app-text disabled:opacity-40">{prompt.length > 54 ? `${prompt.slice(0, 54)}…` : prompt}</button>)}</div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-app-gray"><span className="flex items-center gap-1.5"><Search className="h-3.5 w-3.5" />{quota.remaining} recherche{quota.remaining > 1 ? 's' : ''} restante{quota.remaining > 1 ? 's' : ''} cette semaine</span><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Consentement et blocages respectés</span><button className="flex items-center gap-1.5 hover:text-app-text"><SlidersHorizontal className="h-3.5 w-3.5" />Préférences Love</button></div>
        </div>
      </section>

      {activeMatches.length > 0 && <section className="mt-7"><div className="mb-3"><p className="text-xs font-semibold uppercase tracking-wider text-[#E27D60]">Tes connexions</p><h2 className="mt-1 text-xl font-semibold text-app-text">Matchs Love actifs</h2></div><LoveActiveMatches matches={activeMatches} setSelectedMatch={setSelectedActive} onOpenChat={async (match) => openChatWith(match.id)} /></section>}
      {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <AnimatePresence mode="wait">{!searched ? <motion.section key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-xl py-14 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-app-muted"><Heart className="h-6 w-6 text-[#E27D60]" /></div><h2 className="mt-5 text-lg font-semibold text-app-text">Pas de swipe infini.</h2><p className="mt-2 text-sm leading-6 text-app-gray">Une recherche, quatre propositions. Tu choisis avec qui tu veux vraiment prendre le temps de faire connaissance.</p></motion.section> : <motion.section key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#E27D60]">Ta sélection</p><h2 className="mt-1 text-xl font-semibold text-app-text">{results.length} profil{results.length > 1 ? 's' : ''} qui pourrai{results.length > 1 ? 'ent' : 't'} te correspondre</h2><p className="mt-1 text-sm text-app-gray">Recherche : « {query} »</p></div><button onClick={() => { setResults([]); setSearched(false); setQuery(''); }} className="text-xs font-medium text-app-gray hover:text-app-text">Nouvelle recherche</button></div>{results.length === 0 ? <div className="rounded-3xl border border-dashed border-app-border p-10 text-center text-sm text-app-gray">Aucun profil ne correspond assez à ta demande. Essaie une formulation différente lors de ta prochaine recherche.</div> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">{results.filter((r) => !passed[r.id]).map((match) => <MatchCard key={match.id} match={match} onLike={() => like(match.id)} onPass={() => setPassed((v) => ({ ...v, [match.id]: true }))} onChat={() => openChatWith(match.id)} />)}</div>}{Object.keys(liked).length > 0 && <p className="mt-5 text-center text-xs text-app-gray">Ton intérêt a été envoyé. Si l’intérêt est réciproque, votre connexion Love apparaîtra ici.</p>}</motion.section>}</AnimatePresence>
    </main>
  );
};
