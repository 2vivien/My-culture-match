import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { exploreService } from '@/src/services/exploreService';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';
import { launchThemes } from '@/src/lib/themes';
import type { ExploreTab, TribeItem, VideoPost } from '@/src/types/explore';
import type { Post } from '@/src/types/post';

export function useExplore(posts: Post[] = []) {
  const [activeSubTab, setActiveSubTab] = useState<ExploreTab>('Tribu');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  const { data } = useQuery({
    queryKey: ['explore'],
    queryFn: exploreService.getExploreData,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const tribes = useMemo(() => data?.tribes ?? [], [data]);
  const moreTribes = useMemo(() => data?.moreTribes ?? [], [data]);
  const videos = useMemo(() => data?.videos ?? [], [data]);

  const [localTribes, setLocalTribes] = useState<TribeItem[]>([]);
  const [localMoreTribes, setLocalMoreTribes] = useState<TribeItem[]>([]);

  // Sync local state with query data when it changes
  useState(() => {
    if (tribes.length > 0 && localTribes.length === 0) setLocalTribes(tribes);
    if (moreTribes.length > 0 && localMoreTribes.length === 0) setLocalMoreTribes(moreTribes);
  });

  const toggleJoinTribe = (id: string, isMore = false) => {
    if (isMore) {
      setLocalMoreTribes((prev) => prev.map((t) => (t.id === id ? { ...t, joined: !t.joined } : t)));
    } else {
      setLocalTribes((prev) => prev.map((t) => (t.id === id ? { ...t, joined: !t.joined } : t)));
    }
  };

  const filteredTribes = useMemo(() => localTribes.filter((t) => {
    const matchSearch = searchQuery.trim() === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (activeCategory === 'All') return true;
    if (activeCategory === 'Most Visited') return t.visitors.endsWith('M');
    return t.desc.toLowerCase().includes(activeCategory.split(' ')[0].toLowerCase()) || t.name.toLowerCase().includes(activeCategory.split(' ')[0].toLowerCase());
  }), [localTribes, searchQuery, activeCategory]);

  // Posts : tous les posts du feed, filtrés par catégorie (tags) et recherche
  const filteredPosts = useMemo(() => posts.filter((p) => {
    const matchSearch = searchQuery.trim() === '' ||
      (p.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.text ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags ?? []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchSearch) return false;

    if (activeCategory === 'All') return true;
    return (p.tags ?? []).some((t) => t.toLowerCase().includes(activeCategory.toLowerCase()));
  }), [posts, searchQuery, activeCategory]);

  const filteredVideos = useMemo(() => videos.filter((v) => {
    const matchSearch = searchQuery.trim() === '' ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (activeCategory === 'All') return true;
    return v.category === activeCategory;
  }), [videos, searchQuery, activeCategory]);

  return {
    activeSubTab,
    setActiveSubTab,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    tribes: localTribes.length > 0 ? localTribes : tribes,
    filteredTribes,
    moreTribes: localMoreTribes,
    filteredPosts,
    filteredVideos,
    toggleJoinTribe,
    launchThemes,
  };
}
