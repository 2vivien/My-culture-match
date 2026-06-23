import React from 'react';
import { motion } from 'framer-motion';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import type { LoveMatch } from '@/src/types/love';

interface LoveActiveMatchesProps {
  matches: LoveMatch[];
  setSelectedMatch: (match: LoveMatch) => void;
}

export const LoveActiveMatches: React.FC<LoveActiveMatchesProps> = ({
  matches,
  setSelectedMatch,
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
  );
};
