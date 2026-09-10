import type { SearchResults, SearchType } from '@/src/types/search';
import { api } from './api';

export const searchService = {
  async search(q: string, type: SearchType = 'all', limit = 20, offset = 0): Promise<SearchResults> {
    const params = new URLSearchParams({ q, type, limit: String(limit), offset: String(offset) });
    return api.get<SearchResults>(`/api/search?${params.toString()}`);
  },
};
