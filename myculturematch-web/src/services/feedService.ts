import feedMock from '@/src/mocks/feed.json';
import type { Post } from '@/src/types/post';

const USE_MOCK = true;
const API_BASE = '';

export const feedService = {
  async getPosts(filter: 'following' | 'for-you' | 'popular' = 'following'): Promise<Post[]> {
    if (USE_MOCK) {
      const posts = feedMock as Post[];
      if (filter === 'for-you') {
        return [...posts].reverse();
      }
      return posts;
    }
    const res = await fetch(`${API_BASE}/api/feed?filter=${filter}`);
    if (!res.ok) throw new Error('Failed to fetch feed');
    return res.json() as Promise<Post[]>;
  },

  async likePost(postId: string): Promise<void> {
    if (USE_MOCK) {
      return;
    }
    await fetch(`${API_BASE}/api/posts/${postId}/like`, { method: 'POST' });
  },

  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'views'>): Promise<Post> {
    if (USE_MOCK) {
      return {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        views: 0,
      };
    }
    const res = await fetch(`${API_BASE}/api/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json() as Promise<Post>;
  },
};
export type FeedServiceType = typeof feedService;
