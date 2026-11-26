import type { PostItem, TribeRule, TribeModerator } from '@/src/types/tribu';
import { api } from './api';
import type { TribeInfo } from '@/src/hooks/useTribu';
import { fallbackAvatar } from '@/src/lib/media';

interface BackendTribeDetail {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  membersCount: number;
  createdAt: string;
  joined: boolean;
}

/** HydratedPost du backend (GET /api/tribes/:id/posts). */
interface BackendHydratedPost {
  id: string;
  author: { name?: string; username?: string; avatar?: string | null };
  title?: string | null;
  body?: string | null;
  text?: string | null;
  mediaUrls?: string[];
  image?: string | null;
  tags?: string[];
  score?: number;
  comments?: number;
  myVote?: number;
  createdAt?: string;
}

const TAG_COLORS = [
  'bg-[#E27D60]/10 text-[#E27D60]',
  'bg-violet-500/10 text-violet-500',
  'bg-emerald-500/10 text-emerald-600',
  'bg-sky-500/10 text-sky-600',
];

function mapPost(p: BackendHydratedPost): PostItem {
  const tag = (p.tags ?? [])[0] ?? 'Post';
  return {
    id: p.id,
    author: p.author?.name ?? 'Membre',
    timeAgo: p.createdAt ? relativeDays(p.createdAt) : '',
    title: p.title ?? (p.body ?? '').slice(0, 60) ?? 'Post',
    tagText: `#${tag}`,
    tagColor: TAG_COLORS[(tag.length + tag.charCodeAt(0)) % TAG_COLORS.length],
    body: p.body ?? undefined,
    mediaUrl: p.mediaUrls?.[0] ?? p.image ?? undefined,
    tags: p.tags ?? [],
    upvotes: p.score ?? 0,
    commentsCount: p.comments ?? 0,
    hasUpvoted: (p.myVote ?? 0) === 1,
  };
}

function relativeDays(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export const tribuService = {
  async fetchTribeInfo(tribeId?: string): Promise<TribeInfo | null> {
    if (!tribeId) return null;
    const t = await api.get<BackendTribeDetail>(`/api/tribes/${tribeId}`);
    return {
      id: t.id,
      name: t.name,
      tag: t.tag ?? '',
      description: t.description ?? null,
      membersCount: t.membersCount ?? 0,
      createdAt: t.createdAt,
      joined: Boolean(t.joined),
    };
  },

  async fetchPosts(tribeId?: string): Promise<PostItem[]> {
    if (!tribeId) return [];
    const data = await api.get<{ posts: BackendHydratedPost[] } | BackendHydratedPost[]>(
      `/api/tribes/${tribeId}/posts`,
    );
    const list = Array.isArray(data) ? data : (data.posts ?? []);
    return list.map(mapPost);
  },

  async fetchRules(tribeId?: string): Promise<TribeRule[]> {
    if (!tribeId) return [];
    const data = await api.get<{ rules: TribeRule[] } | TribeRule[]>(`/api/tribes/${tribeId}/rules`);
    const rules = Array.isArray(data) ? data : (data.rules ?? []);
    return Array.isArray(rules) ? rules : [];
  },

  async fetchModerators(tribeId?: string): Promise<TribeModerator[]> {
    if (!tribeId) return [];
    const data = await api.get<{ moderators: Array<{ userId: string; role: string; name: string }> } | Array<{ userId: string; role: string; name: string }>>(
      `/api/tribes/${tribeId}/moderators`,
    );
    const mods = Array.isArray(data) ? data : (data.moderators ?? []);
    return Array.isArray(mods)
      ? mods.map((m) => ({ name: m.name, role: m.role, avatar: fallbackAvatar(m.name) ?? '' }))
      : [];
  },

  /** POST /api/tribu/posts/:id/upvote — toggle upvote, renvoie le nouveau score. */
  async votePost(postId: string, value: 1 | -1): Promise<{ myVote: number; score: number }> {
    return api.post<{ myVote: number; score: number }>(`/api/tribu/posts/${postId}/upvote`, { value });
  },

  /** POST /api/posts/:id/comments — commentaire réel sur un post de tribu. */
  async addComment(postId: string, text: string): Promise<{ commentId: string }> {
    return api.post<{ commentId: string }>(`/api/posts/${postId}/comments`, { text });
  },
};
