import type { TribeOption, TraditionSubmission } from '@/src/types/createTradition';
import { api } from './api';
import { fallbackAvatar } from '@/src/lib/media';
import { slugifyTag } from '@/src/lib/slug';

/** Réponse paginée du backend GET /api/tribes : { tribes, nextCursor }. */
interface BackendTribeList {
  tribes?: Array<{ id: string; name: string; avatar?: string | null }>;
}

export const traditionService = {
  /** GET /api/tribes/mine — tribus de l'utilisateur (owner d'abord) pour la sidebar. */
  async getMyTribes(): Promise<TribeOption[]> {
    const data = await api.get<{ tribes?: Array<{ id: string; name: string; avatar?: string | null }> }>(
      '/api/tribes/mine',
    );
    return (data?.tribes ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      avatar: t.avatar ?? fallbackAvatar(t.name) ?? '',
    }));
  },

  async getTribes(): Promise<TribeOption[]> {
    // Le backend renvoie { tribes: [...], nextCursor } — on normalise en tableau.
    const data = await api.get<BackendTribeList | TribeOption[]>('/api/tribes');
    const list = Array.isArray(data) ? data : (data?.tribes ?? []);
    return list.map((t) => ({
      id: t.id,
      name: t.name,
      avatar: t.avatar ?? fallbackAvatar(t.name) ?? '',
    }));
  },

  /**
   * POST /api/posts — le schéma backend (zod strict) attend :
   * { type, title (3..200), body?, mediaUrls?, linkUrl?, tribeId?, tags? }.
   * Tags convertis au format slug (^[a-z0-9-]+$), sinon ils sont rejetés.
   */
  async submitTradition(data: TraditionSubmission): Promise<{ success: boolean }> {
    const payload: Record<string, unknown> = {
      type: data.type,
      title: data.title.trim().slice(0, 200),
      tribeId: data.tribeId,
    };
    if (data.body?.trim()) payload.body = data.body.trim().slice(0, 5000);
    if (data.mediaUrl) payload.mediaUrls = [data.mediaUrl];
    if (data.linkUrl?.trim()) payload.linkUrl = data.linkUrl.trim();
    const tags = (data.tags ?? []).map(slugifyTag).filter(Boolean).slice(0, 5);
    if (tags.length > 0) payload.tags = tags;
    return api.post<{ success: boolean }>('/api/posts', payload);
  },
};
