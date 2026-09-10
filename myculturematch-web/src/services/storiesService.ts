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

  async addStory(img: string): Promise<Story> {
    const data = await api.post<BackendStory>('/api/stories', { mediaUrl: img });
    return { id: data.id, name: data.name, img: data.img, isAdd: data.isMine };
  },
};
