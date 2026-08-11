import tribuMock from '@/src/mocks/tribu.json';
import type { PostItem, TribeRule, TribeModerator } from '@/src/types/tribu';
import { api, USE_MOCK } from './api';

export const tribuService = {
  getPosts(): PostItem[] {
    return tribuMock.posts as PostItem[];
  },
  getRules(): TribeRule[] {
    return tribuMock.rules as TribeRule[];
  },
  getModerators(): TribeModerator[] {
    return tribuMock.moderators as TribeModerator[];
  },

  async fetchPosts(tribeId: string): Promise<PostItem[]> {
    if (USE_MOCK) {
      return tribuMock.posts as PostItem[];
    }
    return api.get<PostItem[]>(`/api/tribes/${tribeId}/posts`);
  },

  async fetchRules(tribeId: string): Promise<TribeRule[]> {
    if (USE_MOCK) {
      return tribuMock.rules as TribeRule[];
    }
    return api.get<TribeRule[]>(`/api/tribes/${tribeId}/rules`);
  },

  async fetchModerators(tribeId: string): Promise<TribeModerator[]> {
    if (USE_MOCK) {
      return tribuMock.moderators as TribeModerator[];
    }
    return api.get<TribeModerator[]>(`/api/tribes/${tribeId}/moderators`);
  },
};
