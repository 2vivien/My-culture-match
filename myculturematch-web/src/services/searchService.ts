import searchMock from '@/src/mocks/search.json';
import type { SearchResults, SearchType, SearchUser, SearchPost, SearchTribe } from '@/src/types/search';
import { api, USE_MOCK } from './api';

export const searchService = {
  async search(q: string, type: SearchType = 'all', limit = 20, offset = 0): Promise<SearchResults> {
    if (USE_MOCK) {
      const query = q.toLowerCase().trim();
      if (!query) return { users: [], posts: [], tribes: [] };

      const users: SearchUser[] = searchMock.users.filter((u) =>
        u.name.toLowerCase().includes(query) || u.country.toLowerCase().includes(query)
      );
      const posts: SearchPost[] = searchMock.posts.filter((p) =>
        p.title.toLowerCase().includes(query) || p.tags.some((t) => t.includes(query))
      );
      const tribes: SearchTribe[] = searchMock.tribes.filter((t) =>
        t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
      );

      if (type === 'users') return { users, posts: [], tribes: [] };
      if (type === 'posts') return { users: [], posts, tribes: [] };
      if (type === 'tribes') return { users: [], posts: [], tribes };
      return { users, posts, tribes };
    }
    const params = new URLSearchParams({ q, type, limit: String(limit), offset: String(offset) });
    return api.get<SearchResults>(`/api/search?${params.toString()}`);
  },
};
