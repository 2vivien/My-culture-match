import type { Post } from '@/src/types/post';
import { api } from './api';

export const feedService = {
  async getPosts(filter: 'following' | 'for-you' | 'popular' = 'following'): Promise<Post[]> {
    const data = await api.get<{ posts: unknown[]; total: number; nextCursor: string | null }>(`/api/feed?filter=${filter}`);
    return (data.posts ?? []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      author: {
        id: (p.author as Record<string, string>)?.id ?? '',
        name: (p.author as Record<string, string>)?.name ?? '',
        avatar: (p.author as Record<string, string>)?.avatar ?? '',
        location: (p.author as Record<string, string>)?.location ?? '',
      },
      text: (p.body as string) || (p.text as string) || '',
      image: (p.mediaUrls as string[])?.[0] ?? (p.image as string) ?? undefined,
      likes: (p.likes as number) ?? 0,
      comments: (p.comments as number) ?? 0,
      views: (p.views as number) ?? 0,
      date: p.createdAt as string,
      createdAt: p.createdAt as string,
      tribe: (p.tribe as { id: string; name: string } | null) ?? undefined,
      tags: (p.tags as string[]) ?? [],
    })) as Post[];
  },

  async likePost(postId: string): Promise<void> {
    await api.post(`/api/posts/${postId}/like`);
  },

  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'views'>): Promise<Post> {
    const payload: Record<string, unknown> = {
      title: data.text?.slice(0, 50) || 'Tradition',
      body: data.text,
      tribeId: data.tribe?.id,
      tags: data.tags,
    };
    if (data.image) {
      payload.type = 'Images';
      payload.mediaUrls = [data.image];
    } else {
      payload.type = 'Text';
    }
    return api.post<Post>('/api/posts', payload);
  },
};
export type FeedServiceType = typeof feedService;
