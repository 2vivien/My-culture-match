import type { PostItem, TribeRule, TribeModerator } from '@/src/types/tribu';
import { api } from './api';

export const tribuService = {
  async fetchPosts(tribeId?: string): Promise<PostItem[]> {
    if (!tribeId) return [];
    return api.get<PostItem[]>(`/api/tribes/${tribeId}/posts`);
  },

  async fetchRules(tribeId?: string): Promise<TribeRule[]> {
    if (!tribeId) return [];
    return api.get<TribeRule[]>(`/api/tribes/${tribeId}/rules`);
  },

  async fetchModerators(tribeId?: string): Promise<TribeModerator[]> {
    if (!tribeId) return [];
    return api.get<TribeModerator[]>(`/api/tribes/${tribeId}/moderators`);
  },
};
