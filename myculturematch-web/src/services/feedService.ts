import type { Post } from '@/src/types/post';
import { mapHydratedPost } from '@/src/lib/postMapper';
import { api } from './api';
import { slugifyTag } from '@/src/lib/slug';

export const feedService = {
  async getPosts(filter: 'following' | 'for-you' | 'popular' | 'new' | 'tribes' = 'following'): Promise<Post[]> {
    const data = await api.get<{ posts: unknown[]; total: number; nextCursor: string | null }>(`/api/feed?filter=${filter}`);
    return (data.posts ?? []).map(mapHydratedPost);
  },

  async likePost(postId: string): Promise<{ liked: boolean; likes: number }> {
    return api.post<{ liked: boolean; likes: number }>(`/api/posts/${postId}/like`);
  },

  /**
   * POST /api/posts — payload strict attendu par le backend (zod) :
   * { type: 'Text'|'Images'|'Link', title (3..200), body?, mediaUrls?, tags? }.
   * Un blob local (mock upload) ne peut pas partir : on n'envoie que du Text.
   */
  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'views'>): Promise<Post> {
    const text = data.text?.trim() ?? '';
    const image = data.image ?? '';
    const isRealUrl = image.startsWith('http') || image.startsWith('/');
    const payload: Record<string, unknown> = {
      type: isRealUrl ? 'Images' : 'Text',
      title: text.slice(0, 60) || 'Tradition',
      body: text || '📷',
      ...(isRealUrl ? { mediaUrls: [image] } : {}),
      ...(data.tags && data.tags.length > 0 ? { tags: data.tags.map(slugifyTag).filter(Boolean).slice(0, 5) } : {}),
    };
    const created = await api.post<Record<string, unknown>>('/api/posts', payload);
    // Le backend renvoie un HydratedPost — on le mappe au format Post du front.
    return mapHydratedPost(created);
  },
};
export type FeedServiceType = typeof feedService;
