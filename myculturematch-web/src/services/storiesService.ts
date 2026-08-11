import storiesMock from '@/src/mocks/stories.json';
import type { Story } from '@/src/types/story';
import { api, USE_MOCK } from './api';

export const storiesService = {
  async getStories(): Promise<Story[]> {
    if (USE_MOCK) {
      return storiesMock as Story[];
    }
    return api.get<Story[]>('/api/stories');
  },

  async addStory(img: string): Promise<Story> {
    if (USE_MOCK) {
      return {
        id: crypto.randomUUID(),
        name: 'My Story',
        img,
      };
    }
    return api.post<Story>('/api/stories', { mediaUrl: img });
  },
};
