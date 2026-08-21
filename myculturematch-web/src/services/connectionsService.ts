import { api, USE_MOCK } from './api';
import connectionsMock from '@/src/mocks/connections.json';
import type { ConnectionUser } from '@/src/stores/useConnectionsStore';

/** Backend → Frontend mapping helpers. */
interface BackendProfile {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  matchScore: number;
}

interface BackendConnection {
  profile: BackendProfile;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface BackendSuggestion {
  profile: BackendProfile;
  reason: string;
  sharedTraits: string[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  benin: '🇧🇯', 'new zealand': '🇳🇿', senegal: '🇸🇳', ethiopia: '🇪🇹',
  mexico: '🇲🇽', japan: '🇯🇵', france: '🇫🇷', jordan: '🇯🇴',
  morocco: '🇲🇦', brazil: '🇧🇷', usa: '🇺🇸', uk: '🇬🇧',
  canada: '🇨🇦', australia: '🇦🇺', germany: '🇩🇪', spain: '🇪🇸',
  italy: '🇮🇹', 'south korea': '🇰🇷', china: '🇨🇳', india: '🇮🇳',
  egypt: '🇪🇬', ghana: '🇬🇭', nigeria: '🇳🇬', kenya: '🇰🇪',
  peru: '🇵🇪', colombia: '🇨🇴', argentina: '🇦🇷',
};

function mapProfileToConnectionUser(p: BackendProfile): ConnectionUser {
  const countryKey = (p.country ?? '').toLowerCase();
  return {
    id: p.id,
    name: p.name,
    avatar: p.avatar ?? `https://api.dicebear.com/7.x/open-peeps/svg?seed=${p.id}`,
    matchScore: p.matchScore,
    country: p.country ?? '',
    countryFlag: COUNTRY_FLAGS[countryKey] ?? '🌍',
    countryCode: countryKey.slice(0, 2).toUpperCase(),
    interestedCount: 0,
    compagnonsCount: 0,
    interests: p.bio ? [p.bio] : [],
    online: false,
    isConnected: false,
  };
}

export const connectionsService = {
  async getSuggestions(): Promise<ConnectionUser[]> {
    if (USE_MOCK) return connectionsMock.suggestions as ConnectionUser[];
    const data = await api.get<{ suggestions: BackendSuggestion[]; remaining: number }>('/api/connections/suggestions');
    return (data.suggestions ?? []).map((s) => ({
      ...mapProfileToConnectionUser(s.profile),
      interests: s.sharedTraits,
    }));
  },

  async getInterested(): Promise<ConnectionUser[]> {
    if (USE_MOCK) return connectionsMock.interested as ConnectionUser[];
    const data = await api.get<{ success: boolean; connections: BackendConnection[] }>('/api/connections/interested');
    return (data.connections ?? []).map((c) => mapProfileToConnectionUser(c.profile));
  },

  async getRequests(): Promise<ConnectionUser[]> {
    if (USE_MOCK) return connectionsMock.demandes as ConnectionUser[];
    const data = await api.get<{ success: boolean; connections: BackendConnection[] }>('/api/connections/requests');
    return (data.connections ?? []).map((c) => mapProfileToConnectionUser(c.profile));
  },

  async getCompanions(): Promise<ConnectionUser[]> {
    if (USE_MOCK) return connectionsMock.compagnons as ConnectionUser[];
    const data = await api.get<{ success: boolean; connections: BackendConnection[] }>('/api/connections/companions');
    return (data.connections ?? []).map((c) => ({ ...mapProfileToConnectionUser(c.profile), isConnected: true }));
  },

  async sendRequest(targetId: string): Promise<void> {
    if (USE_MOCK) return;
    await api.post(`/api/connections/${targetId}/request`);
  },

  async acceptRequest(requesterId: string): Promise<void> {
    if (USE_MOCK) return;
    await api.post(`/api/requests/${requesterId}/accept`);
  },

  async declineRequest(requesterId: string): Promise<void> {
    if (USE_MOCK) return;
    await api.post(`/api/requests/${requesterId}/decline`);
  },

  async blockRequest(requesterId: string): Promise<void> {
    if (USE_MOCK) return;
    await api.post(`/api/requests/${requesterId}/block`);
  },
};
