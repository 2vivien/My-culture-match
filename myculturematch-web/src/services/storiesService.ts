import type { Story } from '@/src/types/story';
import { api } from './api';

interface BackendStory {
  id: string;
  userId: string;
  name: string;
  img: string;
  caption?: string | null;
  type: 'image' | 'video';
  createdAt: string;
  expiresAt: string;
  isMine: boolean;
  viewed: boolean;
}

export const storiesService = {
  async getStories(): Promise<Story[]> {
    const data = await api.get<BackendStory[]>('/api/stories');
    return data.map((s) => ({
      id: s.id,
      name: s.name,
      img: s.img,
      isAdd: s.isMine,
    }));
  },

  /** `place` : lieu choisi (facultatif), ramené à une zone approximative par le serveur. */
  async addStory(input: { img: string; place?: { latitude: number; longitude: number; label?: string } | null }): Promise<Story> {
    const data = await api.post<BackendStory>('/api/stories', { mediaUrl: input.img, ...(input.place ? { place: input.place } : {}) });
    return { id: data.id, name: data.name, img: data.img, isAdd: data.isMine };
  },
};
