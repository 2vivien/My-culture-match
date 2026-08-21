import requestsMock from '@/src/mocks/requests.json';
import type { RequestItem } from '@/src/types/request';
import { api, USE_MOCK } from './api';

/** Backend connection shape for requests. */
interface BackendConnection {
  profile: { id: string; name: string; avatar: string | null; matchScore: number };
  status: string;
  createdAt: string;
}

function mapRequest(c: BackendConnection): RequestItem {
  return {
    id: c.profile.id,
    name: c.profile.name,
    avatar: c.profile.avatar ?? `https://api.dicebear.com/7.x/open-peeps/svg?seed=${c.profile.id}`,
    actionText: 'veut se connecter avec vous',
    timeAgo: c.createdAt,
    badgeType: 'heart',
    connectionsCount: c.profile.matchScore,
    connectedCount: 0,
  };
}

export const requestsService = {
  async getRequests(): Promise<RequestItem[]> {
    if (USE_MOCK) {
      return requestsMock as RequestItem[];
    }
    const data = await api.get<{ success: boolean; connections: BackendConnection[] }>('/api/connections/requests');
    return (data.connections ?? []).map(mapRequest);
  },

  async handleRequest(requestId: string, action: 'block' | 'okay'): Promise<void> {
    if (USE_MOCK) {
      return;
    }
    const endpoint = action === 'okay' ? 'accept' : 'block';
    await api.post(`/api/requests/${requestId}/${endpoint}`);
  },
};
