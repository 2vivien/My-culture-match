import { useState } from 'react';
import { loveService } from '@/src/services/loveService';
import type { LoveMatch, LoveFilters } from '@/src/types/love';

export function useLove() {
  const [matches] = useState<LoveMatch[]>(() => loveService.getLoveMatches());
  const [activeFilter, setActiveFilter] = useState<'All' | 'Online' | 'MatchScore'>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LoveFilters>({
    origin: '',
    location: '',
    distance: 'Partout',
    ageRange: [18, 60],
    gender: 'Tout le monde',
  });
  const [selectedMatch, setSelectedMatch] = useState<LoveMatch | null>(null);
  const [matchCelebrating, setMatchCelebrating] = useState<string | null>(null);
  const [lovedIds, setLovedIds] = useState<Record<string, boolean>>({});
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleLoveClick = (clientX: number, clientY: number, match: LoveMatch) => {
    const id = match.id;
    const isLoved = !lovedIds[id];
    setLovedIds((prev) => ({ ...prev, [id]: isLoved }));

    if (isLoved) {
      setMatchCelebrating(id);
      
      // Floating hearts animation setup
      const newHearts = Array.from({ length: 8 }).map((_, i) => ({
        id: Date.now() + i,
        x: clientX + (Math.random() - 0.5) * 60,
        y: clientY - 20 - Math.random() * 40,
      }));
      setFloatingHearts((prev) => [...prev, ...newHearts]);
      setTimeout(() => {
        setFloatingHearts((prev) =>
          prev.filter((h) => !newHearts.find((nh) => nh.id === h.id))
        );
      }, 1500);
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (activeFilter === 'Online' && !m.online) return false;
    if (activeFilter === 'MatchScore' && m.matchScore < 90) return false;

    if (filters.gender === 'Hommes' && m.gender !== 'male') return false;
    if (filters.gender === 'Femmes' && m.gender !== 'female') return false;

    if (m.age < filters.ageRange[0] || m.age > filters.ageRange[1]) return false;

    if (filters.origin.trim() !== '') {
      const q = filters.origin.toLowerCase();
      const matchText = `${m.country} ${m.interest} ${m.name} ${m.about}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    if (filters.location.trim() !== '') {
      const q = filters.location.toLowerCase();
      const matchText = `${m.country} ${m.about}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  const isFiltersActive =
    filters.origin ||
    filters.location ||
    filters.distance !== 'Partout' ||
    filters.ageRange[0] !== 18 ||
    filters.ageRange[1] !== 60 ||
    filters.gender !== 'Tout le monde';

  return {
    matches,
    filteredMatches,
    activeFilter,
    setActiveFilter,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    selectedMatch,
    setSelectedMatch,
    matchCelebrating,
    setMatchCelebrating,
    lovedIds,
    floatingHearts,
    handleLoveClick,
    isFiltersActive,
  };
}
