import exploreMock from '@/src/mocks/explore.json';
import { api, USE_MOCK } from './api';
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
    if (USE_MOCK) {
      return {
        tribes: exploreMock.tribes as TribeItem[],
        moreTribes: exploreMock.moreTribes as TribeItem[],
        companions: exploreMock.companions as CompanionItem[],
        images: exploreMock.images as ImagePost[],
        videos: exploreMock.videos as VideoPost[],
      };
    }
    return api.get<ExploreData>('/api/explore');
  },
};
