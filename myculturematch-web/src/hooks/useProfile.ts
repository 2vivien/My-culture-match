import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/src/stores/useAppStore';
import { userService } from '@/src/services/userService';
import { connectionsService } from '@/src/services/connectionsService';
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
  togo: 'tg', cameroon: 'cm', mali: 'ml', 'burkina faso': 'bf',
  guinea: 'gn', niger: 'ne', 'united states': 'us',
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
  if (location.includes(',')) {
    const parts = location.split(',');
    return { city: parts[0]?.trim() ?? '', country: parts[1]?.trim() ?? '' };
  }
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
    username: apiUser?.username ?? fallback.username ?? 'user',
    avatar: apiUser?.avatar ?? fallback.avatar ?? '',
    locale: apiUser?.locale ?? fallback.locale ?? 'fr',
    level: apiUser?.level ?? fallback.level ?? 1,
    glow: (apiUser?.glow ?? fallback.glow ?? 'none') as CurrentUser['glow'],
    tribes: apiUser?.tribes ?? fallback.tribes ?? [],
    postsCount: apiUser?.postsCount ?? fallback.postsCount ?? 0,
    culturesCount: apiUser?.culturesCount ?? fallback.culturesCount ?? 0,
    tribesCount: apiUser?.tribesCount ?? fallback.tribesCount ?? 0,
    location: apiUser?.location ?? fallback.location ?? '',
    country: apiUser?.country ?? fallback.country ?? '',
    bio: apiUser?.bio ?? fallback.bio ?? null,
    age: (apiUser as { age?: number | null })?.age ?? fallback.age ?? null,
    interestedCount: apiUser?.interestedCount ?? fallback.interestedCount ?? 0,
    companionsCount: apiUser?.companionsCount ?? fallback.companionsCount ?? 0,
    followersCount: apiUser?.followersCount ?? fallback.followersCount ?? 0,
    followingCount: apiUser?.followingCount ?? fallback.followingCount ?? 0,
    role: apiUser?.role ?? fallback.role ?? 'user',
  };
}

/** Statut de connexion réel avec un autre utilisateur (API connections). */
function useConnectionState(targetId: string, isOwn: boolean) {
  const { data: companions } = useQuery({
    queryKey: ['connections', 'companions'],
    queryFn: connectionsService.getCompanions,
    enabled: !isOwn,
    staleTime: 1000 * 60 * 3,
  });

  const isConnected = Boolean(companions?.some((c) => c.id === targetId));
  // 'sent' = demande déjà émise (on ne re-vérifie pas les 'request' sortants côté API pour l'instant)
  const [pendingSent, setPendingSent] = useState(false);

  useEffect(() => {
    setPendingSent(false);
  }, [targetId]);

  return {
    connectionState: (isConnected ? 'connected' : pendingSent ? 'pending' : 'none') as 'none' | 'pending' | 'connected',
    connect: async () => {
      if (isConnected || pendingSent) return;
      await connectionsService.sendRequest(targetId);
      setPendingSent(true);
    },
  };
}

export function useProfile() {
  const {
    selectedProfileUserId,
    profileActiveTab: activeTab,
    setProfileActiveTab: setActiveTab,
    currentUser,
  } = useAppStore();

  // 'user-current' est le placeholder du store persisté : on le remplace par le
  // vrai id courant pour que l'API renvoie les VRAIES stats (jamais des mocks).
  const fallbackId = currentUser.id === 'user-current' ? selectedProfileUserId : currentUser.id;
  const targetId = selectedProfileUserId && selectedProfileUserId !== 'user-current' ? selectedProfileUserId : (fallbackId ?? 'user-current');

  const { data: apiUser, refetch: refetchUser } = useQuery<Partial<CurrentUser>>({
    queryKey: ['user', targetId],
    queryFn: () => userService.fetchUserById(targetId),
    enabled: !!targetId,
    staleTime: 1000 * 30,
  });

  const user = hydrateCurrentUser(targetId, apiUser, currentUser);

  const isOwnProfile = targetId === currentUser.id;

  const { connectionState, connect } = useConnectionState(targetId, isOwnProfile);

  const toggleConnection = () => {
    if (isOwnProfile || connectionState === 'connected') return;
    connect().catch(() => undefined);
  };

  return {
    user,
    currentUser,
    activeTab,
    setActiveTab,
    connectionState,
    toggleConnection,
    refetchUser,
    getCountryCode,
    getCityAndCountry,
    isOwnProfile,
  };
}
