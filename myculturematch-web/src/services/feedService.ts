import feedMock from '@/src/mocks/feed.json';
import type { Post } from '@/src/types/post';
import { api, USE_MOCK } from './api';

export const feedService = {
  async getPosts(filter: 'following' | 'for-you' | 'popular' = 'following'): Promise<Post[]> {
    if (USE_MOCK) {
      const posts = feedMock as Post[];
      if (filter === 'for-you') {
        return [...posts].reverse();
      }
      return posts;
    }
    return api.get<Post[]>(`/api/feed?filter=${filter}`);
  },

  async likePost(postId: string): Promise<void> {
    if (USE_MOCK) {
      return;
    }
    await api.post(`/api/posts/${postId}/like`);
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
    return api.post<Post>('/api/posts', data);
  },
};
export type FeedServiceType = typeof feedService;
