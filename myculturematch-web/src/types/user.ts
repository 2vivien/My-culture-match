export interface CurrentUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  /** Bannière de profil (URL publique MinIO). */
  banner?: string | null;
  locale: string;
  level: number;
  glow: 'orange' | 'red' | 'blue' | 'turquoise' | 'violet';
  tribes: string[];
  postsCount: number;
  culturesCount: number;
  tribesCount: number;
  location: string;
  country: string;
  bio?: string | null;
  age?: number | null;
  interestedCount?: number;
  companionsCount?: number;
  followersCount?: number;
  followingCount?: number;
  role?: string;
}

export type ProfileTitle = 'Explorateur' | 'Voyageur' | 'Gardien' | 'Sage' | 'Ancêtre';

export function getProfileTitle(level: number): ProfileTitle {
  if (level <= 10) return 'Explorateur';
  if (level <= 20) return 'Voyageur';
  if (level <= 40) return 'Gardien';
  if (level <= 70) return 'Sage';
  return 'Ancêtre';
}
