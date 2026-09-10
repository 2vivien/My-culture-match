import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/src/stores/useAppStore';
import { userService } from '@/src/services/userService';
import type { CurrentUser } from '@/src/types/user';

const COUNTRY_CODES: Record<string, string> = {
  benin: 'bj', 'new zealand': 'nz', senegal: 'sn', ethiopia: 'et',
  mexico: 'mx', japan: 'jp', france: 'fr', jordan: 'jo',
  morocco: 'ma', brazil: 'br', usa: 'us', uk: 'gb', 'united kingdom': 'gb',
  canada: 'ca', australia: 'au', germany: 'de', spain: 'es', italy: 'it',
  'south korea': 'kr', china: 'cn', india: 'in', egypt: 'eg',
  'ivory coast': 'ci', ghana: 'gh', nigeria: 'ng', kenya: 'ke',
  tanzania: 'tz', peru: 'pe', colombia: 'co', argentina: 'ar',
  chile: 'cl', norway: 'no', sweden: 'se', denmark: 'dk',
};

const COUNTRY_CITIES: Record<string, string> = {
  benin: 'Cotonou', 'new zealand': 'Wellington', senegal: 'Dakar',
  ethiopia: 'Addis Ababa', mexico: 'Mexico City', jordan: 'Amman',
  usa: 'New York', peru: 'Cusco', morocco: 'Casablanca',
  brazil: 'Rio de Janeiro', france: 'Paris', japan: 'Tokyo',
  uk: 'London', 'united kingdom': 'London', canada: 'Toronto',
  australia: 'Sydney', germany: 'Berlin', spain: 'Madrid',
  italy: 'Rome', 'south korea': 'Seoul', china: 'Beijing',
  india: 'Mumbai', egypt: 'Cairo', nigeria: 'Lagos', kenya: 'Nairobi',
};

function getCountryCode(location: string): string {
  const loc = location.toLowerCase().trim();
  for (const [key, code] of Object.entries(COUNTRY_CODES)) {
    if (loc.includes(key)) return code;
  }
  return 'us';
}

function getCityAndCountry(location: string): { city: string; country: string } {
  if (location.includes(' - ')) {
    const parts = location.split(' - ');
    return { city: parts[0], country: parts[1] };
  }
  const loc = location.toLowerCase().trim();
  for (const [key, city] of Object.entries(COUNTRY_CITIES)) {
    if (loc === key) return { city, country: location };
  }
  return { city: location, country: location };
}

function hydrateCurrentUser(id: string, apiUser: Partial<CurrentUser> | undefined, fallback: CurrentUser): CurrentUser {
  return {
    id: apiUser?.id ?? fallback.id ?? id,
    name: apiUser?.name ?? fallback.name ?? 'Utilisateur',
    avatar: apiUser?.avatar ?? fallback.avatar ?? '',
    locale: apiUser?.locale ?? fallback.locale ?? 'fr',
    level: fallback.level ?? 1,
    glow: (fallback.glow ?? 'orange') as CurrentUser['glow'],
    tribes: apiUser?.tribes ?? fallback.tribes ?? [],
    traditionsCount: apiUser?.traditionsCount ?? fallback.traditionsCount ?? 0,
    culturesCount: apiUser?.culturesCount ?? fallback.culturesCount ?? 0,
    tribesCount: apiUser?.tribesCount ?? fallback.tribesCount ?? 0,
    location: apiUser?.location ?? fallback.location ?? 'Bénin',
    interestedCount: apiUser?.interestedCount ?? fallback.interestedCount ?? 0,
    companionsCount: apiUser?.companionsCount ?? fallback.companionsCount ?? 0,
    role: apiUser?.role ?? fallback.role ?? 'user',
  };
}

export function useTotemProfile() {
  const {
    selectedTotemUserId,
    profileActiveTab: activeTab,
    setProfileActiveTab: setActiveTab,
    currentUser,
  } = useAppStore();

  const targetId = selectedTotemUserId && selectedTotemUserId !== currentUser.id ? selectedTotemUserId : currentUser.id;

  const { data: apiUser } = useQuery<Partial<CurrentUser>>({
    queryKey: ['user', targetId],
    queryFn: () => userService.fetchUserById(targetId),
    enabled: !!targetId,
    staleTime: 1000 * 60 * 5,
  });

  const user = hydrateCurrentUser(targetId, apiUser, currentUser);
  const [connectionState, setConnectionState] = useState<'none' | 'pending' | 'connected'>('none');

  const isOwnProfile = targetId === currentUser.id;

  const toggleConnection = () => {
    setConnectionState((prev) => {
      if (prev === 'none') return 'pending';
      if (prev === 'pending') return 'connected';
      return 'none';
    });
  };

  return {
    user,
    currentUser,
    activeTab,
    setActiveTab,
    connectionState,
    toggleConnection,
    getCountryCode,
    getCityAndCountry,
    isOwnProfile,
  };
}