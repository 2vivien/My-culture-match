import React from 'react';
import { motion } from 'framer-motion';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import type { LoveMatch } from '@/src/types/love';

interface LoveActiveMatchesProps {
  matches: LoveMatch[];
  setSelectedMatch: (match: LoveMatch) => void;
  /** Ouvre la messagerie avec la personne (matchs déjà connectés). */
  onOpenChat: (match: LoveMatch) => void;
}

/**
 * Active Matches — stories horizontales. Les matchs actifs (en ligne) portent
 * un anneau vert : ils sont déjà connectés. Un clic sur un match connecté
 * ouvre directement la messagerie avec lui ; sinon la fiche détail s'ouvre.
 */
export const LoveActiveMatches: React.FC<LoveActiveMatchesProps> = ({
  matches,
  setSelectedMatch,
  onOpenChat,
}) => {
  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="text-xs font-bold uppercase tracking-wider text-app-gray px-1">
        Active Matches
      </h2>
      <div className="flex items-center gap-6 overflow-x-auto pb-4 hide-scrollbar px-1">
        {matches.map((item) => (
          <motion.div
            key={`story-${item.id}`}
            onClick={() => (item.online ? onOpenChat(item) : setSelectedMatch(item))}
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
            title={item.online ? `Ouvrir la conversation avec ${item.name.split(' ')[0]}` : undefined}
          >
            {/* Anneau vert = match actif déjà connecté (en ligne) */}
            <div
              className={
                item.online
                  ? 'rounded-full p-[3px] bg-gradient-to-tr from-emerald-400 to-emerald-500'
                  : 'rounded-full p-[3px] bg-zinc-200 dark:bg-zinc-800'
              }
            >
              <div className="rounded-full bg-white dark:bg-zinc-950 p-[2px]">
                <TotemAvatar
                  src={item.avatar}
                  alt={item.name}
                  size="lg"
                  statusDot={item.online ? 'online' : 'none'}
                  glow="none"
                  countryFlag={item.flag}
                />
              </div>
            </div>
            <span className="text-[10px] font-bold text-app-black dark:text-zinc-300">
              {item.name.split(' ')[0]}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
