import storiesMock from '@/src/mocks/stories.json';
import type { Story } from '@/src/types/story';

const USE_MOCK = true;
const API_BASE = '';

export const storiesService = {
  async getStories(): Promise<Story[]> {
    if (USE_MOCK) {
      return storiesMock as Story[];
    }
    const res = await fetch(`${API_BASE}/api/stories`);
    if (!res.ok) throw new Error('Failed to fetch stories');
    return res.json() as Promise<Story[]>;
  },

  async addStory(img: string): Promise<Story> {
    if (USE_MOCK) {
      return {
        id: crypto.randomUUID(),
        name: 'My Story',
        img,
      };
    }
    const res = await fetch(`${API_BASE}/api/stories`, {
      method: 'POST',
      body: JSON.stringify({ img }),
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json() as Promise<Story>;
  },
};
