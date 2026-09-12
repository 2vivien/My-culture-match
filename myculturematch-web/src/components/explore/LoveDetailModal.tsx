import React from 'react';
import { motion } from 'framer-motion';
import { X, MessageCircle, Flame } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import type { LoveMatch } from '@/src/types/love';

interface LoveDetailModalProps {
  match: LoveMatch;
  isLoved: boolean;
  onClose: () => void;
  onLoveClick: (e: React.MouseEvent) => void;
  onStartChat: () => void;
}

/**
 * Popup détail d'un match — UNE SEULE popup claire (fond blanc, pas de noir),
 * photo pleine avec drapeau, nom + âge en dessous, bio, et actions
 * (I'm Interested / Start Conversation / Keep exploring).
 */
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
      className="fixed inset-0 bg-app-black/25 dark:bg-black/50 backdrop-blur-xs z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 26, stiffness: 340 }}
        className="bg-white dark:bg-[#161b22] border border-app-border dark:border-zinc-800 rounded-[32px] max-w-md w-full overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-app-border dark:border-zinc-700 text-app-gray flex items-center justify-center hover:text-app-black dark:hover:text-white transition-colors cursor-pointer shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Photo — plus de pill de score sur la photo */}
        <div className="relative h-64 w-full bg-gradient-to-br from-[#E27D60]/15 via-[#6c63fc]/10 to-[#2dd9d9]/15">
          <img
            src={match.avatar}
            alt={match.name}
            className="w-full h-full object-cover select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/85 dark:from-[#161b22]/85 via-transparent to-transparent" />

          {/* Photo de profil dentelée (cloud) + nom + % sur la même ligne, en bas de la photo */}
          <div className="absolute bottom-4 left-5 right-5 flex items-center gap-3">
            <TotemAvatar
              src={match.avatar}
              alt={match.name}
              size="md"
              shape="cloud"
              glow="none"
            />
            <div className="drop-shadow-sm flex items-baseline gap-2 min-w-0">
              <h3 className="text-xl font-extrabold text-app-black dark:text-white leading-tight truncate">
                {match.name}
              </h3>
              <span className="text-sm text-app-gray dark:text-zinc-300 font-bold shrink-0">{match.matchScore}%</span>
            </div>
          </div>
        </div>

        {/* Info Area */}
        <div className="p-6 pt-5">
          <div>
            <span className="text-[10px] font-black tracking-wider text-app-gray block uppercase">About Me</span>
            <p className="text-sm text-app-gray dark:text-zinc-400 leading-relaxed mt-1">
              {match.about || 'Cette personne n\u2019a pas encore partagé sa story.'}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full mt-6 select-none">
            {/* I'm Interested — appel réel à l'API like */}
            <button
              onClick={onLoveClick}
              className={cn(
                'w-full py-3.5 rounded-2xl text-sm font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95',
                isLoved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#E27D60] text-white hover:brightness-105'
              )}
            >
              <Flame className={cn('w-4.5 h-4.5', isLoved ? 'fill-white text-white' : 'fill-white text-white')} />
              {isLoved ? 'Interest Sent!' : "I'm Interested"}
            </button>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onStartChat}
                className="flex-1 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-app-border dark:border-zinc-700 text-app-black dark:text-white text-xs font-black hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4.5 h-4.5 text-[#E27D60]" />
                Start Conversation
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl text-xs font-black text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer active:scale-95 transition-all"
              >
                Keep exploring
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
