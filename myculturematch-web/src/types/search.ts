export type SearchType = 'users' | 'posts' | 'tribes' | 'all';

export interface SearchUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  country: string | null;
}

export interface SearchPost {
  id: string;
  title: string | null;
  authorName: string;
  type: string;
  tags: string[];
  createdAt: string;
}

export interface SearchTribe {
  id: string;
  name: string;
  tag: string | null;
  description: string | null;
  avatar: string | null;
  memberCount: number;
}

export interface SearchResults {
  users: SearchUser[];
  posts: SearchPost[];
  tribes: SearchTribe[];
}
