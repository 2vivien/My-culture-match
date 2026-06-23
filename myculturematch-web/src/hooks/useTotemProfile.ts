import { useState } from 'react';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import { userService } from '@/src/services/userService';
import { useFeed } from '@/src/hooks/useFeed';

export function useTotemProfile() {
  const { 
    selectedTotemUserId, 
    profileActiveTab: activeTab, 
    setProfileActiveTab: setActiveTab, 
    currentUser 
  } = useAppStore();
  
  const { setActiveTab: setMainActiveTab } = useUIStore();
  const user = userService.getUserById(selectedTotemUserId);
  const { posts } = useFeed();
  
  const [connectionState, setConnectionState] = useState<'none' | 'pending' | 'connected'>('none');

  const getCountryCode = (location: string) => {
    const loc = location.toLowerCase();
    if (loc.includes('benin')) return 'bj';
    if (loc.includes('zealand')) return 'nz';
    if (loc.includes('senegal')) return 'sn';
    if (loc.includes('ethiopia')) return 'et';
    if (loc.includes('mexico')) return 'mx';
    if (loc.includes('japan')) return 'jp';
    if (loc.includes('france')) return 'fr';
    if (loc.includes('jordan')) return 'jo';
    if (loc.includes('morocco')) return 'ma';
    if (loc.includes('brazil')) return 'br';
    return 'us';
  };

  const getCityAndCountry = (location: string) => {
    if (location.includes(' - ')) {
      const parts = location.split(' - ');
      return { city: parts[0], country: parts[1] };
    }
    const loc = location.toLowerCase();
    if (loc === 'benin') return { city: 'Cotonou', country: 'Benin' };
    if (loc === 'new zealand') return { city: 'Wellington', country: 'New Zealand' };
    if (loc === 'senegal') return { city: 'Dakar', country: 'Senegal' };
    if (loc === 'ethiopia') return { city: 'Addis Ababa', country: 'Ethiopia' };
    if (loc === 'mexico') return { city: 'Mexico City', country: 'Mexico' };
    if (loc === 'jordan') return { city: 'Amman', country: 'Jordan' };
    if (loc === 'usa') return { city: 'New York', country: 'USA' };
    if (loc === 'peru') return { city: 'Cusco', country: 'Peru' };
    if (loc === 'morocco') return { city: 'Casablanca', country: 'Morocco' };
    if (loc === 'brazil') return { city: 'Rio de Janeiro', country: 'Brazil' };
    return { city: location, country: location };
  };

  const isOwnProfile = user.id === currentUser.id;

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
    posts,
    activeTab,
    setActiveTab,
    setMainActiveTab,
    connectionState,
    toggleConnection,
    getCountryCode,
    getCityAndCountry,
    isOwnProfile,
  };
}
