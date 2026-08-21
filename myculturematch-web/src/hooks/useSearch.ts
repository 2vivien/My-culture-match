import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/src/services/searchService';
import type { SearchResults, SearchType } from '@/src/types/search';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 350;

const emptyResults: SearchResults = { users: [], posts: [], tribes: [] };

export function useSearch(query: string, type: SearchType = 'all') {
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());

  useEffect(() => {
    const trimmed = query.trim();
    const timer = setTimeout(() => setDebouncedQuery(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const enabled = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const { data = emptyResults, isLoading, isFetching, error } = useQuery<SearchResults>({
    queryKey: ['search', debouncedQuery, type],
    queryFn: () => searchService.search(debouncedQuery, type),
    enabled,
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev ?? emptyResults,
  });

  return {
    data,
    query: debouncedQuery,
    hasQuery: enabled,
    isLoading,
    isFetching,
    error,
  };
}
