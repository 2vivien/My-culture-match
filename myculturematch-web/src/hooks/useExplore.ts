import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { exploreService } from '@/src/services/exploreService';
import { useUIStore } from '@/src/stores/useUIStore';
import type { ExploreTab, TribeItem, CompanionItem, ImagePost, VideoPost } from '@/src/types/explore';

export function useExplore() {
  const [activeSubTab, setActiveSubTab] = useState<ExploreTab>('Tribu');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxImage, setLightboxImage] = useState<ImagePost | null>(null);

  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);

  const { data } = useQuery({
    queryKey: ['explore'],
    queryFn: exploreService.getExploreData,
    staleTime: 1000 * 60 * 5,
  });

  const tribes = useMemo(() => data?.tribes ?? [], [data]);
  const moreTribes = useMemo(() => data?.moreTribes ?? [], [data]);
  const companions = useMemo(() => data?.companions ?? [], [data]);
  const images = useMemo(() => data?.images ?? [], [data]);
  const videos = useMemo(() => data?.videos ?? [], [data]);

  const [localTribes, setLocalTribes] = useState<TribeItem[]>([]);
  const [localMoreTribes, setLocalMoreTribes] = useState<TribeItem[]>([]);
  const [localCompanions, setLocalCompanions] = useState<CompanionItem[]>([]);

  // Sync local state with query data when it changes
  useEffect(() => {
    if (tribes.length > 0 && localTribes.length === 0) setLocalTribes(tribes);
    if (moreTribes.length > 0 && localMoreTribes.length === 0) setLocalMoreTribes(moreTribes);
    if (companions.length > 0 && localCompanions.length === 0) setLocalCompanions(companions);
  }, [tribes, moreTribes, companions]);

  const toggleJoinTribe = (id: string, isMore = false) => {
    if (isMore) {
      setLocalMoreTribes((prev) => prev.map((t) => (t.id === id ? { ...t, joined: !t.joined } : t)));
    } else {
      setLocalTribes((prev) => prev.map((t) => (t.id === id ? { ...t, joined: !t.joined } : t)));
    }
  };

  const toggleConnectCompanion = (id: string) => {
    setLocalCompanions((prev) => prev.map((c) => (c.id === id ? { ...c, connected: !c.connected } : c)));
  };

  useEffect(() => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const hasPersonMatch = localCompanions.some((c) =>
        c.name.toLowerCase().includes(q) || c.interests.some((i) => i.toLowerCase().includes(q))
      );
      const hasTribeMatch = localTribes.some((t) =>
        t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
      );
      
      if (hasPersonMatch && (!hasTribeMatch || localCompanions.some((c) => c.name.toLowerCase() === q))) {
        setActiveSubTab('Connexion');
      }
    }
  }, [searchQuery, localCompanions, localTribes]);

  const filteredTribes = useMemo(() => localTribes.filter((t) => {
    const matchSearch = searchQuery.trim() === '' || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Most Visited') return t.visitors.endsWith('M');
    return t.desc.toLowerCase().includes(activeCategory.split(' ')[0].toLowerCase()) || t.name.toLowerCase().includes(activeCategory.split(' ')[0].toLowerCase());
  }), [localTribes, searchQuery, activeCategory]);

  const filteredCompanions = useMemo(() => localCompanions.filter((c) => {
    const matchSearch = searchQuery.trim() === '' || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.interests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchSearch) return false;

    if (activeCategory === 'All') return true;
    if (activeCategory === '90%+ Matches') return c.matchScore >= 90;
    if (activeCategory === 'Shared Totems') return c.interests.length >= 3;
    if (activeCategory === 'Active Level') return c.level >= 15;
    return true;
  }), [localCompanions, searchQuery, activeCategory]);

  const filteredImages = useMemo(() => images.filter((img) => {
    const matchSearch = searchQuery.trim() === '' || 
      img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (activeCategory === 'All') return true;
    return img.category === activeCategory;
  }), [images, searchQuery, activeCategory]);

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
    lightboxImage,
    setLightboxImage,
    filteredTribes,
    moreTribes: localMoreTribes,
    filteredCompanions,
    filteredImages,
    filteredVideos,
    toggleJoinTribe,
    toggleConnectCompanion,
  };
}
