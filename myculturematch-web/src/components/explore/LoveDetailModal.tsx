import React from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, MessageCircle, Flame } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { LoveMatch } from '@/src/types/love';

interface LoveDetailModalProps {
  match: LoveMatch;
  isLoved: boolean;
  onClose: () => void;
  onLoveClick: (e: React.MouseEvent) => void;
  onStartChat: () => void;
}

export const LoveDetailModal: React.FC<LoveDetailModalProps> = ({
  match,
  isLoved,
  onClose,
  onLoveClick,
  onStartChat,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 flex items-center justify-center p-4"
      onClick={onClose}
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
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Photo Area */}
        <div className="relative h-64 w-full bg-zinc-900">
          <img src={match.avatar} alt={match.name} className="w-full h-full object-cover select-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <div className="absolute bottom-4 inset-x-5 flex items-end justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-white">{match.name}</h3>
              <div className="flex items-center gap-2 mt-1 select-none text-white">
                <MapPin className="w-3.5 h-3.5 text-[#E27D60] shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{match.country}</span>
                <span className="text-white/40 text-[9px]">•</span>
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
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
            </div>
            <div className="px-3 py-1 rounded-full bg-[#E27D60] text-[10px] font-black text-white shadow-md">
              {match.matchScore}% Match
            </div>
          </div>
        </div>

        {/* Info Area */}
        <div className="p-6">
          <div className="flex flex-col gap-4 text-app-black dark:text-zinc-200">
            <div>
              <span className="text-[10px] font-black tracking-wider text-[#E27D60] block uppercase">Cultural Focus</span>
              <span className="text-sm font-bold text-app-black dark:text-white mt-0.5 block">{match.interest}</span>
            </div>

            <div>
              <span className="text-[10px] font-black tracking-wider text-app-gray block uppercase">About Me</span>
              <p className="text-xs text-app-gray dark:text-zinc-400 leading-relaxed mt-1">{match.about}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full mt-7 select-none">
            <button
              onClick={onLoveClick}
              className={cn(
                'flex-1 py-3.5 rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95',
                isLoved
                  ? 'bg-[#E27D60] text-white hover:brightness-105'
                  : 'bg-app-black text-white dark:bg-white dark:text-app-black hover:opacity-90'
              )}
            >
              <Flame className={cn('w-4.5 h-4.5', isLoved ? 'fill-white text-[#E27D60]' : 'text-white dark:text-app-black')} />
              {isLoved ? 'Synergy Active!' : 'Express Interest'}
            </button>
            
            <button
              onClick={onStartChat}
              className="w-12.5 h-12.5 rounded-2xl border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer active:scale-95 transition-all"
            >
              <MessageCircle className="w-5.5 h-5.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
