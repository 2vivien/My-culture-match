import React from 'react';
import { motion } from 'framer-motion';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import type { LoveMatch } from '@/src/types/love';

interface LoveCardProps {
  match: LoveMatch;
  isLoved: boolean;
  onSelect: () => void;
  onLoveClick: (e: React.MouseEvent) => void;
}

/**
 * Carte Love — photo pleine avec le % de match en haut de la carte
 * (badge visible, comme "99% match"), et en bas : photo de profil en forme
 * dentelée (cloud Totem) + nom. Le clic ouvre le popup détail.
 */
export const LoveCard: React.FC<LoveCardProps> = ({
  match,
  onSelect,
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
      className="relative aspect-[3/4.2] rounded-[32px] overflow-hidden shadow-lg border border-app-border dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 group cursor-pointer"
    >
      {/* Photo pleine */}
      <img
        src={match.avatar}
        alt={match.name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 select-none"
        loading="lazy"
      />

      {/* Badge % de match en haut de la carte */}
      <div className="absolute top-3 left-3 right-3 flex justify-center">
        <span className="px-4 py-1.5 rounded-full bg-black/45 backdrop-blur-md text-white text-xs font-black tracking-wide shadow-md border border-white/20">
          {match.matchScore}% match
        </span>
      </div>

      {/* Dégradé bas pour la lisibilité */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

      {/* Ligne du bas : photo de profil dentelée (cloud) + nom */}
      <div className="absolute bottom-4 inset-x-4 flex items-center gap-2.5 select-none">
        <TotemAvatar
          src={match.avatar}
          alt={match.name}
          size="xs"
          shape="cloud"
          glow="none"
        />
        <span className="font-extrabold text-white text-base truncate drop-shadow-md leading-tight">
          {match.name}
        </span>
      </div>
    </motion.div>
  );
};
