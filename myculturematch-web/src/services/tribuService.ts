import tribuMock from '@/src/mocks/tribu.json';
import type { PostItem, TribeRule, TribeModerator } from '@/src/types/tribu';

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
};
