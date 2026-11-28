import React from 'react';
import { flairBadgeStyle } from '@/src/lib/tribeAccess';

interface FlairBadgeProps {
  name: string;
  color: string;
  className?: string;
}

/**
 * Pastille de flair. La couleur vient du serveur : elle est validée (#RRGGBB) par
 * flairBadgeStyle avant d'arriver dans le style inline, jamais dans du CSS brut.
 */
export const FlairBadge: React.FC<FlairBadgeProps> = ({ name, color, className = '' }) => (
  <span
    className={`inline-block max-w-[10rem] truncate align-middle text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${className}`}
    style={flairBadgeStyle(color)}
    title={`Flair : ${name}`}
  >
    {name}
  </span>
);
