import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';
import { FiltersModal } from '@/src/components/ui/FiltersModal';
import { useLove } from '@/src/hooks/useLove';
import { LoveHeader } from '../love/LoveHeader';
import { LoveActiveMatches } from '../love/LoveActiveMatches';
import { LoveCard } from '../love/LoveCard';
import { LoveMatchCelebrate } from '../love/LoveMatchCelebrate';
import { LoveDetailModal } from './LoveDetailModal';

export const LoveColumn: React.FC = () => {
  const { setActiveTab } = useUIStore();
  const {
    matches,
    filteredMatches,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    selectedMatch,
    setSelectedMatch,
    matchCelebrating,
    setMatchCelebrating,
    lovedIds,
    floatingHearts,
    handleLoveClick,
    isFiltersActive,
  } = useLove();

  const celebratingMatch = matches.find((m) => m.id === matchCelebrating);

  const startChat = () => {
    setMatchCelebrating(null);
    setSelectedMatch(null);
    setActiveTab('Chat');
  };

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full flex flex-col gap-6 overflow-y-auto hide-scrollbar pb-16 px-1">
      {/* Page Header */}
      <LoveHeader
        setShowFilters={setShowFilters}
        isFiltersActive={!!isFiltersActive}
      />

      {/* Spotlight Stories / Active Matches */}
      <LoveActiveMatches
        matches={matches}
        setSelectedMatch={setSelectedMatch}
      />

      {/* Cards Grid Spotlight Feed */}
      <div className="flex flex-col gap-3.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-app-gray px-1">
          Spotlight Feed
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredMatches.map((match) => (
              <LoveCard
                key={match.id}
                match={match}
                isLoved={!!lovedIds[match.id]}
                onSelect={() => setSelectedMatch(match)}
                onLoveClick={(e) => handleLoveClick(e.clientX, e.clientY, match)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Celebration Match Modal */}
      <AnimatePresence>
        {celebratingMatch && (
          <LoveMatchCelebrate
            match={celebratingMatch}
            onClose={() => setMatchCelebrating(null)}
            onStartChat={startChat}
          />
        )}
      </AnimatePresence>

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {selectedMatch && !matchCelebrating && (
          <LoveDetailModal
            match={selectedMatch}
            isLoved={!!lovedIds[selectedMatch.id]}
            onClose={() => setSelectedMatch(null)}
            onLoveClick={(e) => handleLoveClick(e.clientX, e.clientY, selectedMatch)}
            onStartChat={startChat}
          />
        )}
      </AnimatePresence>

      {/* Heart Click Animation Particles */}
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

      {/* Settings/Preferences Filter Panel */}
      <FiltersModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        setFilters={setFilters}
      />
    </main>
  );
};
