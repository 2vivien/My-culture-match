export interface CurrentUser {
  id: string;
  name: string;
  avatar: string;
  locale: string;
  level: number;
  glow: 'orange' | 'red' | 'blue' | 'turquoise' | 'violet';
  tribes: string[];
  traditionsCount: number;
  culturesCount: number;
  tribesCount: number;
  location: string;
}

export type TotemTitle = 'Explorateur' | 'Voyageur' | 'Gardien' | 'Sage' | 'Ancêtre';

export function getTotemTitle(level: number): TotemTitle {
  if (level <= 10) return 'Explorateur';
  if (level <= 20) return 'Voyageur';
  if (level <= 40) return 'Gardien';
  if (level <= 70) return 'Sage';
  return 'Ancêtre';
}
