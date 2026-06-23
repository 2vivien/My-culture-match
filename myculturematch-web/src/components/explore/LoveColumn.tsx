import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Heart, Sparkles, MessageCircle, MapPin, Check, X, Compass, Users, Bubbles, SlidersHorizontal } from 'lucide-react';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { cn } from '@/src/lib/utils';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';

const FunnelPlus = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    <path d="M19 14h4" />
    <path d="M21 12v4" />
  </svg>
);

interface LoveMatch {
  id: string;
  name: string;
  age: number;
  gender: 'female' | 'male' | 'non-binary';
  country: string;
  flag: string;
  avatar: string;
  matchScore: number;
  online: boolean;
  interest: string;
  about: string;
}

export const LoveColumn: React.FC = () => {
  const { setActiveTab } = useUIStore();
  const [matches, setMatches] = useState<LoveMatch[]>([
    {
      id: 'lm1',
      name: 'Chloe Yu',
      age: 22,
      gender: 'female',
      country: 'USA',
      flag: '🇺🇸',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
      matchScore: 98,
      online: true,
      interest: 'Yamato Traditions • Origami',
      about: 'Love exploring ancient shrines, digital art, and Japanese tea ceremonies. Let’s connect!'
    },
    {
      id: 'lm2',
      name: 'Sophia Shinto',
      age: 24,
      gender: 'female',
      country: 'Japan',
      flag: '🇯🇵',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      matchScore: 96,
      online: true,
      interest: 'Ainu Folklore • Chants',
      about: 'Hokkaido explorer. Singing traditional Kamuy songs and practicing wood carving.'
    },
    {
      id: 'lm3',
      name: 'Grace Celtic',
      age: 23,
      gender: 'female',
      country: 'UK',
      flag: '🇬🇧',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      matchScore: 92,
      online: true,
      interest: 'Celtic Myth • Harpist',
      about: 'Folk musician. I play the Celtic harp and read ancient tree scripts (Ogham).'
    },
    {
      id: 'lm4',
      name: 'Elena Quechua',
      age: 25,
      gender: 'female',
      country: 'Peru',
      flag: '🇵🇪',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
      matchScore: 89,
      online: false,
      interest: 'Andean Loom • Weaving',
      about: 'Keeping the colors of Cusco alive through backstrap loom weaving and storytelling.'
    },
    {
      id: 'lm5',
      name: 'Nala Benin',
      age: 21,
      gender: 'female',
      country: 'Benin',
      flag: '🇧🇯',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=600&q=80',
      matchScore: 94,
      online: true,
      interest: 'Zulu Rhythms • Dance',
      about: 'Voodoo rhythms drummer and modern afro-fusion dancer. Let’s match our beats!'
    },
    {
      id: 'lm6',
      name: 'Zara Maori',
      age: 23,
      gender: 'female',
      country: 'New Zealand',
      flag: '🇳🇿',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
      matchScore: 91,
      online: true,
      interest: 'Haka Legends • Maori Art',
      about: 'Passionate about powerful chants, regional tattoo history, and ocean protection.'
    },
    {
      id: 'lm7',
      name: 'Caleb Norse',
      age: 26,
      gender: 'male',
      country: 'Norway',
      flag: '🇳🇴',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
      matchScore: 88,
      online: true,
      interest: 'Runes & Sagas History',
      about: 'Reconstructing historical Norse longhouses and writing Edda poetry.'
    },
    {
      id: 'lm8',
      name: 'Ethan Yamato',
      age: 25,
      gender: 'male',
      country: 'Japan',
      flag: '🇯🇵',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      matchScore: 85,
      online: false,
      interest: 'Shinto Calligraphy',
      about: 'Shinto festival drummer and Zen ink painting instructor.'
    }
  ]);

  const [activeFilter, setActiveFilter] = useState<'All' | 'Online' | 'MatchScore'>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    origin: string;
    location: string;
    distance: string;
    ageRange: [number, number];
    gender: 'Hommes' | 'Femmes' | 'Tout le monde';
  }>({
    origin: '',
    location: '',
    distance: 'Partout',
    ageRange: [18, 60],
    gender: 'Tout le monde',
  });
  const [selectedMatch, setSelectedMatch] = useState<LoveMatch | null>(null);
  const [matchCelebrating, setMatchCelebrating] = useState<string | null>(null); // lmId
  const [lovedIds, setLovedIds] = useState<Record<string, boolean>>({});
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Filter logic
  const filteredMatches = matches.filter((m) => {
    // 1. Tab filters
    if (activeFilter === 'Online' && !m.online) return false;
    if (activeFilter === 'MatchScore' && m.matchScore < 90) return false;

    // 2. Custom Filter Modal parameters
    if (filters.gender === 'Hommes' && m.gender !== 'male') return false;
    if (filters.gender === 'Femmes' && m.gender !== 'female') return false;

    if (m.age < filters.ageRange[0] || m.age > filters.ageRange[1]) return false;

    if (filters.origin.trim() !== '') {
      const q = filters.origin.toLowerCase();
      const matchText = `${m.country} ${m.interest} ${m.name} ${m.about}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    if (filters.location.trim() !== '') {
      const q = filters.location.toLowerCase();
      const matchText = `${m.country} ${m.about}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  const handleLoveClick = (e: React.MouseEvent, match: LoveMatch) => {
    e.stopPropagation();
    const id = match.id;
    const isLoved = !lovedIds[id];
    setLovedIds((prev) => ({ ...prev, [id]: isLoved }));

    if (isLoved) {
      // Trigger celebrating match modal
      setMatchCelebrating(id);
      
      // Floating hearts animation
      const newHearts = Array.from({ length: 8 }).map((_, i) => ({
        id: Date.now() + i,
        x: e.clientX + (Math.random() - 0.5) * 60,
        y: e.clientY - 20 - Math.random() * 40
      }));
      setFloatingHearts((prev) => [...prev, ...newHearts]);
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((h) => !newHearts.find((nh) => nh.id === h.id)));
      }, 1500);
    }
  };

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full flex flex-col gap-6 overflow-y-auto hide-scrollbar pb-16 px-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-app-border dark:border-zinc-800 pb-5 pt-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-app-black dark:text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-[#E27D60] fill-[#E27D60]" />
            Love Matchmaker
          </h1>
          <p className="text-xs text-app-gray mt-1 font-medium">
            Find high-vibe soul matches and explore shared cultural heritages worldwide.
          </p>
        </div>

        {/* Filter button */}
        <div className="flex items-center gap-2 shrink-0 select-none">
          <button
            onClick={() => setShowFilters(true)}
            className="px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 text-app-gray hover:text-app-black dark:hover:text-white border border-transparent dark:border-zinc-800"
          >
            <FunnelPlus className="w-3.5 h-3.5 text-[#E27D60]" />
            <span className="hidden sm:inline">Filters</span>
            {(filters.origin || filters.location || filters.distance !== 'Partout' || filters.ageRange[0] !== 18 || filters.ageRange[1] !== 60 || filters.gender !== 'Tout le monde') && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#E27D60] animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* TOP COMPONENT: Active Stories/Spotlight with Cloud Borders */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-app-gray px-1">
          Active Matches
        </h2>
        <div className="flex items-center gap-6 overflow-x-auto pb-4 hide-scrollbar px-1">
          {matches.map((item) => (
            <motion.div
              key={`story-${item.id}`}
              onClick={() => setSelectedMatch(item)}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
            >
              <TotemAvatar
                src={item.avatar}
                alt={item.name}
                size="lg"
                statusDot={item.online ? 'online' : 'none'}
                glow={item.matchScore > 90 ? 'turquoise' : 'none'}
                countryFlag={item.flag}
              />
              <span className="text-[10px] font-bold text-app-black dark:text-zinc-300">
                {item.name.split(' ')[0]}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CARDS GRID SECTION */}
      <div className="flex flex-col gap-3.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-app-gray px-1">
          Spotlight Feed
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredMatches.map((match) => {
              const isLoved = lovedIds[match.id];
              return (
                <motion.div
                  key={match.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelectedMatch(match)}
                  className="relative aspect-[3/4.2] rounded-[32px] overflow-hidden shadow-lg border border-app-border dark:border-zinc-800 bg-[#111111] group cursor-pointer"
                >
                  {/* Photo Base */}
                  <img
                    src={match.avatar}
                    alt={match.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 select-none"
                    loading="lazy"
                  />

                  {/* Top Overlays */}
                  <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
                    {/* Online status indicator */}
                    <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
                      <span className={cn('w-2.5 h-2.5 rounded-full', match.online ? 'bg-[#3ddc84] animate-pulse' : 'bg-zinc-400')} />
                    </div>

                    {/* Match score pill */}
                    <div className="px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-[10px] font-black text-[#E27D60] tracking-wider">
                      {match.matchScore}% Match
                    </div>
                  </div>

                  {/* Bottom glassmorphism container */}
                  <div className="absolute bottom-4 inset-x-4 bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[24px] p-4.5 flex items-center justify-between shadow-2xl transition-all duration-300">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-extrabold text-white text-base truncate select-none">
                        {match.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 select-none text-white">
                        <MapPin className="w-3.5 h-3.5 text-[#E27D60] shrink-0" />
                        <span className="text-[10px] text-white/95 font-bold uppercase tracking-wider truncate">
                          {match.country}
                        </span>
                        <span className="text-white/40 text-[9px]">•</span>
                        <span className="text-[10px] text-white/95 font-black uppercase tracking-wider flex items-center gap-1.5">
                          {match.gender === 'female' ? (
                            <span className="text-rose-400 text-base font-black px-1.5 py-0.5 rounded-md bg-rose-400/10 leading-none" title="Female">♀</span>
                          ) : match.gender === 'male' ? (
                            <span className="text-blue-400 text-base font-black px-1.5 py-0.5 rounded-md bg-blue-400/10 leading-none" title="Male">♂</span>
                          ) : (
                            <span className="text-purple-400 text-base font-black px-1.5 py-0.5 rounded-md bg-purple-400/10 leading-none" title="Non-binary">⚧</span>
                          )}
                          <span className="text-xs text-white font-extrabold leading-none">{match.age}</span>
                        </span>
                      </div>
                      <p className="text-[9px] text-white/60 font-semibold truncate mt-1.5 select-none">
                        {match.interest}
                      </p>
                    </div>

                    {/* Flame Match Button - site's custom color #E27D60 */}
                    <button
                      onClick={(e) => handleLoveClick(e, match)}
                      className={cn(
                        'w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer active:scale-95',
                        isLoved
                          ? 'bg-[#E27D60] text-white'
                          : 'bg-white/25 dark:bg-black/30 text-white hover:bg-white/35 hover:scale-105'
                      )}
                    >
                      <Flame className={cn('w-5.5 h-5.5', isLoved ? 'fill-white text-[#E27D60]' : 'text-white')} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* MATCH CONFIRMATION MODAL CELEBRATION */}
      <AnimatePresence>
        {matchCelebrating && (() => {
          const match = matches.find((m) => m.id === matchCelebrating);
          if (!match) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setMatchCelebrating(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="bg-zinc-950 border border-zinc-800 rounded-[32px] max-w-sm w-full p-6 text-center flex flex-col items-center relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#2563eb] via-[#7c3aed] to-[#E27D60]" />
                
                <div className="relative mt-4 mb-5">
                  <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-violet-600 to-rose-500 opacity-30 blur-xl animate-pulse" />
                  <TotemAvatar
                    src={match.avatar}
                    alt={match.name}
                    size="xl"
                    glow="turquoise"
                    countryFlag={match.flag}
                  />
                </div>

                <div className="flex items-center gap-1.5 justify-center mb-1 text-[#E27D60]">
                  <Flame className="w-5.5 h-5.5 fill-current animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-widest text-[#E27D60]">Cultural Synergy!</span>
                </div>

                <h3 className="text-xl font-extrabold text-white">
                  It's a Match with {match.name}!
                </h3>
                
                <p className="text-xs text-zinc-400 mt-2.5 max-w-[280px] leading-relaxed">
                  Your cultures sync at <span className="font-extrabold text-emerald-500">{match.matchScore}%</span>. 
                  Start chatting to exchange ancient stories and local insights!
                </p>

                <div className="flex flex-col gap-2 w-full mt-6 shrink-0">
                  <button
                    onClick={() => {
                      setMatchCelebrating(null);
                      setActiveTab('Chat');
                    }}
                    className="w-full py-3 bg-[#E27D60] text-white rounded-2xl text-xs font-extrabold shadow-lg hover:brightness-105 transition-all cursor-pointer"
                  >
                    Start Conversation
                  </button>
                  <button
                    onClick={() => setMatchCelebrating(null)}
                    className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer"
                  >
                    Keep Exploring
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* MATCH DETAIL MODAL */}
      <AnimatePresence>
        {selectedMatch && !matchCelebrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 flex items-center justify-center p-4"
            onClick={() => setSelectedMatch(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-850 rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedMatch(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Photo Area */}
              <div className="relative h-64 w-full bg-zinc-900">
                <img src={selectedMatch.avatar} alt={selectedMatch.name} className="w-full h-full object-cover select-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-4 inset-x-5 flex items-end justify-between">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">{selectedMatch.name}</h3>
                    <div className="flex items-center gap-2 mt-1 select-none text-white">
                      <MapPin className="w-3.5 h-3.5 text-[#E27D60] shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{selectedMatch.country}</span>
                      <span className="text-white/40 text-[9px]">•</span>
                      <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        {selectedMatch.gender === 'female' ? (
                          <span className="text-rose-400 text-base font-black px-1.5 py-0.5 rounded-md bg-rose-400/10 leading-none" title="Female">♀</span>
                        ) : selectedMatch.gender === 'male' ? (
                          <span className="text-blue-400 text-base font-black px-1.5 py-0.5 rounded-md bg-blue-400/10 leading-none" title="Male">♂</span>
                        ) : (
                          <span className="text-purple-400 text-base font-black px-1.5 py-0.5 rounded-md bg-purple-400/10 leading-none" title="Non-binary">⚧</span>
                        )}
                        <span className="text-xs text-white font-extrabold leading-none">{selectedMatch.age}</span>
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#E27D60] text-[10px] font-black text-white shadow-md">
                    {selectedMatch.matchScore}% Match
                  </div>
                </div>
              </div>

              {/* Info Area */}
              <div className="p-6">
                <div className="flex flex-col gap-4 text-app-black dark:text-zinc-200">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#E27D60] block">Cultural Focus</span>
                    <span className="text-sm font-bold text-app-black dark:text-white mt-0.5 block">{selectedMatch.interest}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-app-gray block">About Me</span>
                    <p className="text-xs text-app-gray dark:text-zinc-400 leading-relaxed mt-1">{selectedMatch.about}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full mt-7 select-none">
                  <button
                    onClick={(e) => {
                      handleLoveClick(e, selectedMatch);
                    }}
                    className={cn(
                      'flex-1 py-3.5 rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95',
                      lovedIds[selectedMatch.id]
                        ? 'bg-[#E27D60] text-white hover:brightness-105'
                        : 'bg-app-black text-white dark:bg-white dark:text-app-black hover:opacity-90'
                    )}
                  >
                    <Flame className={cn('w-4.5 h-4.5', lovedIds[selectedMatch.id] ? 'fill-white text-[#E27D60]' : 'text-white dark:text-app-black')} />
                    {lovedIds[selectedMatch.id] ? 'Synergy Active!' : 'Express Interest'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedMatch(null);
                      setActiveTab('Chat');
                    }}
                    className="w-12.5 h-12.5 rounded-2xl border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-5.5 h-5.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating hearts container for click animations */}
      <AnimatePresence>
        {floatingHearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 1, scale: 0.5, x: heart.x, y: heart.y }}
            animate={{ opacity: 0, scale: 1.5, y: heart.y - 120, rotate: (Math.random() - 0.5) * 30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="fixed pointer-events-none z-50 text-[#E27D60]"
            style={{ left: 0, top: 0 }}
          >
            <Heart className="w-6 h-6 fill-current" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* FILTER MODAL OVERLAY */}
      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-850 rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl relative p-6 text-app-black dark:text-zinc-100 flex flex-col gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-app-border/40 dark:border-zinc-800/40">
                <div>
                  <h3 className="text-xl font-black text-app-black dark:text-white">Filters</h3>
                  <button
                    onClick={() => {
                      setFilters({
                        origin: '',
                        location: '',
                        distance: 'Partout',
                        ageRange: [18, 60],
                        gender: 'Tout le monde',
                      });
                    }}
                    className="text-[#E27D60] text-[10px] font-black uppercase tracking-wider mt-1 hover:underline cursor-pointer"
                  >
                    Reset all
                  </button>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-app-border dark:border-zinc-800 text-app-black dark:text-white flex items-center justify-center hover:opacity-90 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1 hide-scrollbar">
                {/* Origin Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                    Origin / Culture
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Enter desired origin (e.g. Yamato, Celtic...)"
                      value={filters.origin}
                      onChange={(e) => setFilters(prev => ({ ...prev, origin: e.target.value }))}
                      className="w-full bg-[#FCFCFC] dark:bg-zinc-900 text-sm text-app-black dark:text-white border border-app-border dark:border-zinc-800 rounded-2xl py-2.5 px-4 outline-none focus:border-[#E27D60] focus:ring-1 focus:ring-[#E27D60]/20 transition-all placeholder:text-app-gray/60"
                    />
                  </div>
                </div>

                {/* Location Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                    Location
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="City, region, or country..."
                      value={filters.location}
                      onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full bg-[#FCFCFC] dark:bg-zinc-900 text-sm text-app-black dark:text-white border border-app-border dark:border-zinc-800 rounded-2xl py-2.5 px-4 outline-none focus:border-[#E27D60] focus:ring-1 focus:ring-[#E27D60]/20 transition-all placeholder:text-app-gray/60"
                    />
                  </div>
                </div>

                {/* Distance Radius */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                    Search Radius
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['10km', '50km', '100km', 'Partout'].map(d => (
                      <button
                        key={d}
                        onClick={() => setFilters(prev => ({ ...prev, distance: d }))}
                        className={cn(
                          "py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer border select-none text-center",
                          filters.distance === d
                            ? "bg-[#E27D60] border-[#E27D60] text-white"
                            : "bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-800 text-app-gray hover:text-app-black dark:hover:text-white"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Range Inputs */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                      Age Range
                    </label>
                    <span className="text-[11px] font-black text-[#E27D60] bg-[#E27D60]/10 dark:bg-[#E27D60]/20 px-2 py-0.5 rounded-lg">
                      {filters.ageRange[0]} - {filters.ageRange[1]}+
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 select-none">
                    <input
                      type="range"
                      min="18"
                      max="60"
                      value={filters.ageRange[0]}
                      onChange={(e) => setFilters(prev => ({ ...prev, ageRange: [parseInt(e.target.value), prev.ageRange[1]] }))}
                      className="w-full h-1 bg-zinc-250 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#E27D60]"
                    />
                    <input
                      type="range"
                      min="18"
                      max="60"
                      value={filters.ageRange[1]}
                      onChange={(e) => setFilters(prev => ({ ...prev, ageRange: [prev.ageRange[0], parseInt(e.target.value)] }))}
                      className="w-full h-1 bg-zinc-250 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#E27D60]"
                    />
                  </div>
                </div>

                {/* Target Gender / Afficher */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-app-gray dark:text-zinc-400 uppercase tracking-widest">
                    Show Me
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Hommes', 'Femmes', 'Tout le monde'].map(g => (
                      <button
                        key={g}
                        onClick={() => setFilters(prev => ({ ...prev, gender: g as any }))}
                        className={cn(
                          "py-2.5 rounded-xl text-[10px] font-black transition-all cursor-pointer border select-none text-center",
                          filters.gender === g
                            ? "bg-[#E27D60] border-[#E27D60] text-white"
                            : "bg-zinc-50 dark:bg-zinc-900 border-app-border dark:border-zinc-800 text-app-gray hover:text-app-black dark:hover:text-white"
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-[#E27D60] text-white py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:brightness-105 transition-all cursor-pointer select-none mt-2"
              >
                Apply Filters
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};
