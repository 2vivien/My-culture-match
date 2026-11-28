export type ExploreTab = 'Tribu' | 'Posts' | 'Reels' | 'Vidéo';

export interface TribeItem {
  id: string;
  name: string;
  tag: string;
  visitors: string;
  desc: string;
  avatar: string;
  joined: boolean;
  glow: 'turquoise' | 'violet' | 'amber' | 'emerald' | 'none';
}

export interface CompanionItem {
  id: string;
  name: string;
  avatar: string;
  matchScore: number;
  level: number;
  glow: 'turquoise' | 'violet' | 'amber' | 'emerald';
  interests: string[];
  connected: boolean;
}

export interface ImagePost {
  id: string;
  url: string;
  title: string;
  likes: string;
  comments: string;
  category: string;
}

export interface VideoPost {
  id: string;
  thumbnail: string;
  title: string;
  duration: string;
  plays: string;
  category: string;
}
