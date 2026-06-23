import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import type { LoveMatch } from '@/src/types/love';

interface LoveMatchCelebrateProps {
  match: LoveMatch;
  onClose: () => void;
  onStartChat: () => void;
}

export const LoveMatchCelebrate: React.FC<LoveMatchCelebrateProps> = ({
  match,
  onClose,
  onStartChat,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
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
            onClick={onStartChat}
            className="w-full py-3 bg-[#E27D60] text-white rounded-2xl text-xs font-extrabold shadow-lg hover:brightness-105 transition-all cursor-pointer"
          >
            Start Conversation
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer"
          >
            Keep Exploring
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
