import React from 'react';
import { motion } from 'framer-motion';
import { Flame, MapPin } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { LoveMatch } from '@/src/types/love';

interface LoveCardProps {
  match: LoveMatch;
  isLoved: boolean;
  onSelect: () => void;
  onLoveClick: (e: React.MouseEvent) => void;
}

export const LoveCard: React.FC<LoveCardProps> = ({
  match,
  isLoved,
  onSelect,
  onLoveClick,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      onClick={onSelect}
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
          onClick={onLoveClick}
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
};
