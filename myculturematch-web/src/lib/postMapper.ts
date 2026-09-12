import type { Post } from '@/src/types/post';
import { slugifyTag } from '@/src/lib/slug';

/**
 * Convertit un HydratedPost du backend en Post du frontend.
 * Partagé par feedService, createPost et la liste des saves.
 */
export function mapHydratedPost(p: Record<string, unknown>): Post {
  const author = (p.author ?? {}) as Record<string, string>;
  const tribe = (p.tribe ?? null) as { id: string; name: string } | null;
  return {
    id: p.id as string,
    author: {
      id: author.id ?? '',
      name: author.name ?? '',
      username: author.username ?? '',
      avatar: author.avatar ?? '',
      location: author.location ?? '',
    },
    text: (p.body as string) || (p.text as string) || '',
    title: (p.title as string) || undefined,
    image: (p.mediaUrls as string[])?.[0] ?? (p.image as string) ?? undefined,
    likes: (p.likes as number) ?? 0,
    comments: (p.comments as number) ?? 0,
    views: (p.views as number) ?? 0,
    date: p.createdAt as string,
    createdAt: p.createdAt as string,
    tribe: tribe ?? undefined,
    tags: ((p.tags as string[]) ?? []).map(slugifyTag),
    likedByMe: (p.likedByMe as boolean | undefined) ?? undefined,
    type: (p.type as string) || undefined,
    originalPost: p.originalPost ? mapHydratedPost(p.originalPost as Record<string, unknown>) : null,
  };
}
