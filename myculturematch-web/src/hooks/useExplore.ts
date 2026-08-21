import { useState, useEffect } from 'react';
import exploreMock from '@/src/mocks/explore.json';
import { useUIStore } from '@/src/stores/useUIStore';
import type { ExploreTab, TribeItem, CompanionItem, ImagePost, VideoPost } from '@/src/types/explore';

export function useExplore() {
  const [activeSubTab, setActiveSubTab] = useState<ExploreTab>('Tribu');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxImage, setLightboxImage] = useState<ImagePost | null>(null);

  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);

  const [tribes, setTribes] = useState<TribeItem[]>(exploreMock.tribes as TribeItem[]);
  const [moreTribes, setMoreTribes] = useState<TribeItem[]>(exploreMock.moreTribes as TribeItem[]);
  const [companions, setCompanions] = useState<CompanionItem[]>(exploreMock.companions as CompanionItem[]);
  const [images] = useState<ImagePost[]>(exploreMock.images as ImagePost[]);
  const [videos] = useState<VideoPost[]>(exploreMock.videos as VideoPost[]);

  const toggleJoinTribe = (id: string, isMore = false) => {
    if (isMore) {
      setMoreTribes((prev) => prev.map((t) => (t.id === id ? { ...t, joined: !t.joined } : t)));
    } else {
      setTribes((prev) => prev.map((t) => (t.id === id ? { ...t, joined: !t.joined } : t)));
    }
  };

  const toggleConnectCompanion = (id: string) => {
    setCompanions((prev) => prev.map((c) => (c.id === id ? { ...c, connected: !c.connected } : c)));
  };

  useEffect(() => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const hasPersonMatch = companions.some((c) =>
        c.name.toLowerCase().includes(q) || c.interests.some((i) => i.toLowerCase().includes(q))
      );
      const hasTribeMatch = tribes.some((t) =>
        t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
      );
      
      if (hasPersonMatch && (!hasTribeMatch || companions.some((c) => c.name.toLowerCase() === q))) {
        setActiveSubTab('Connexion');
      }
    }
  }, [searchQuery, companions, tribes]);

  // Filtering lists based on categories and search query
  const filteredTribes = tribes.filter((t) => {
    const matchSearch = searchQuery.trim() === '' || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Most Visited') return t.visitors.endsWith('M');
    return t.desc.toLowerCase().includes(activeCategory.split(' ')[0].toLowerCase()) || t.name.toLowerCase().includes(activeCategory.split(' ')[0].toLowerCase());
  });

  const filteredCompanions = companions.filter((c) => {
    const matchSearch = searchQuery.trim() === '' || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.interests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchSearch) return false;

    if (activeCategory === 'All') return true;
    if (activeCategory === '90%+ Matches') return c.matchScore >= 90;
    if (activeCategory === 'Shared Totems') return c.interests.length >= 3;
    if (activeCategory === 'Active Level') return c.level >= 15;
    return true;
  });

  const filteredImages = images.filter((img) => {
    const matchSearch = searchQuery.trim() === '' || 
      img.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      img.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (activeCategory === 'All') return true;
    return img.category === activeCategory;
  });

  const filteredVideos = videos.filter((v) => {
    const matchSearch = searchQuery.trim() === '' || 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (activeCategory === 'All') return true;
    return v.category === activeCategory;
  });

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
    moreTribes,
    filteredCompanions,
    filteredImages,
    filteredVideos,
    toggleJoinTribe,
    toggleConnectCompanion,
  };
}
