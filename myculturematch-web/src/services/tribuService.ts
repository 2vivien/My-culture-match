import type { PostItem, TribeRule, TribeModerator } from '@/src/types/tribu';
import { api } from './api';
import type { TribeInfo } from '@/src/hooks/useTribu';
import { fallbackAvatar } from '@/src/lib/media';
import { normalizeFlair, type Flair, type TribeRole, type TribeVisibility } from '@/src/lib/tribeAccess';

interface BackendTribeDetail {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  membersCount: number;
  createdAt: string;
  joined: boolean;
  visibility?: TribeVisibility;
  requestPending?: boolean;
  role?: string | null;
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
  flair?: { id: string; name: string; color: string } | null;
}

export interface JoinRequest {
  userId: string;
  name: string;
  username: string | null;
  avatar: string | null;
  createdAt: string;
}

export interface JoinResult {
  joined: boolean;
  requested?: boolean;
  membersCount: number;
}

const TAG_COLORS = [
  'bg-[#E27D60]/10 text-[#E27D60]',
  'bg-violet-500/10 text-violet-500',
  'bg-emerald-500/10 text-emerald-600',
  'bg-sky-500/10 text-sky-600',
];

function mapPost(p: BackendHydratedPost): PostItem {
  const tag = (p.tags ?? [])[0] ?? 'Tradition';
  return {
    id: p.id,
    author: p.author?.name ?? 'Membre',
    timeAgo: p.createdAt ? relativeDays(p.createdAt) : '',
    title: p.title ?? (p.body ?? '').slice(0, 60) ?? 'Tradition',
    tagText: `#${tag}`,
    tagColor: TAG_COLORS[(tag.length + tag.charCodeAt(0)) % TAG_COLORS.length],
    body: p.body ?? undefined,
    mediaUrl: p.mediaUrls?.[0] ?? p.image ?? undefined,
    tags: p.tags ?? [],
    upvotes: p.score ?? 0,
    commentsCount: p.comments ?? 0,
    hasUpvoted: (p.myVote ?? 0) === 1,
    flair: normalizeFlair(p.flair),
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

function normalizeRole(role: unknown): TribeRole {
  return role === 'owner' || role === 'moderator' || role === 'member' ? role : null;
}

const enc = encodeURIComponent;

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
      visibility: t.visibility === 'private' ? 'private' : 'public',
      requestPending: Boolean(t.requestPending),
      role: normalizeRole(t.role),
    };
  },

  /** GET /api/tribes/:id/posts[?sort=&flairId=] — tri côté serveur ; 403 TRIBE_PRIVATE pour un non-membre d'une tribu privée. */
  async fetchPosts(tribeId?: string, sort: 'new' | 'hot' | 'top' | 'controversial' = 'new', flairId?: string | null): Promise<PostItem[]> {
    if (!tribeId) return [];
    const qs = `?sort=${sort}${flairId ? `&flairId=${encodeURIComponent(flairId)}` : ''}`;
    const data = await api.get<{ posts: BackendHydratedPost[] } | BackendHydratedPost[]>(
      `/api/tribes/${tribeId}/posts${qs}`,
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

  // ── Adhésion (C7) ──────────────────────────────────────────

  /** POST /api/tribes/:id/join — publique : adhésion directe ; privée : demande en attente. */
  async join(tribeId: string): Promise<JoinResult> {
    return api.post<JoinResult>(`/api/tribes/${enc(tribeId)}/join`);
  },

  /** DELETE /api/tribes/:id/leave. */
  async leave(tribeId: string): Promise<{ left: boolean }> {
    return api.delete<{ left: boolean }>(`/api/tribes/${enc(tribeId)}/leave`);
  },

  /** DELETE /api/tribes/:id/join-request — retire sa demande (tribu privée). */
  async cancelJoinRequest(tribeId: string): Promise<{ cancelled: boolean }> {
    return api.delete<{ cancelled: boolean }>(`/api/tribes/${enc(tribeId)}/join-request`);
  },

  /** GET /api/tribes/:id/join-requests — modérateur+. */
  async getJoinRequests(tribeId: string): Promise<JoinRequest[]> {
    const data = await api.get<{ requests?: JoinRequest[] }>(`/api/tribes/${enc(tribeId)}/join-requests`);
    return Array.isArray(data?.requests) ? data.requests : [];
  },

  /** POST /api/tribes/:id/join-requests/:userId/(approve|decline) — modérateur+. */
  async resolveJoinRequest(
    tribeId: string,
    userId: string,
    approve: boolean,
  ): Promise<{ approved: boolean; membersCount: number }> {
    return api.post<{ approved: boolean; membersCount: number }>(
      `/api/tribes/${enc(tribeId)}/join-requests/${enc(userId)}/${approve ? 'approve' : 'decline'}`,
    );
  },

  /** PATCH /api/tribes/:id — réglage de visibilité (owner). */
  async setVisibility(tribeId: string, visibility: TribeVisibility): Promise<{ visibility: TribeVisibility }> {
    return api.patch<{ visibility: TribeVisibility }>(`/api/tribes/${enc(tribeId)}`, { visibility });
  },

  // ── Flairs (C8) ────────────────────────────────────────────

  /** GET /api/tribes/:id/flairs. */
  async getFlairs(tribeId: string): Promise<Flair[]> {
    const data = await api.get<{ flairs?: unknown[] }>(`/api/tribes/${enc(tribeId)}/flairs`);
    return (Array.isArray(data?.flairs) ? data.flairs : [])
      .map(normalizeFlair)
      .filter((f): f is Flair => f !== null);
  },

  /** POST /api/tribes/:id/flairs — modérateur+. */
  async createFlair(tribeId: string, input: { name: string; color: string }): Promise<Flair | null> {
    const created = await api.post<unknown>(`/api/tribes/${enc(tribeId)}/flairs`, input);
    return normalizeFlair(created);
  },

  /** DELETE /api/tribes/:id/flairs/:flairId — modérateur+. */
  async deleteFlair(tribeId: string, flairId: string): Promise<{ deleted: boolean }> {
    return api.delete<{ deleted: boolean }>(`/api/tribes/${enc(tribeId)}/flairs/${enc(flairId)}`);
  },

  /** PUT /api/tribes/:id/posts/:postId/flair — auteur ou modérateur ; flairId null retire le flair. */
  async setPostFlair(tribeId: string, postId: string, flairId: string | null): Promise<{ flairId: string | null }> {
    return api.put<{ flairId: string | null }>(
      `/api/tribes/${enc(tribeId)}/posts/${enc(postId)}/flair`,
      { flairId },
    );
  },
};
