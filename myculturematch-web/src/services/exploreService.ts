import { api } from './api';
import type { TribeItem, CompanionItem, ImagePost, VideoPost } from '@/src/types/explore';

export interface ExploreData {
  tribes: TribeItem[];
  moreTribes: TribeItem[];
  companions: CompanionItem[];
  images: ImagePost[];
  videos: VideoPost[];
}

export const exploreService = {
  async getExploreData(): Promise<ExploreData> {
    return api.get<ExploreData>('/api/explore');
  },
};
