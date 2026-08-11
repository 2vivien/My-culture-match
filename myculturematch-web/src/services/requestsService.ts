import requestsMock from '@/src/mocks/requests.json';
import type { RequestItem } from '@/src/types/request';
import { api, USE_MOCK } from './api';

export const requestsService = {
  async getRequests(): Promise<RequestItem[]> {
    if (USE_MOCK) {
      return requestsMock as RequestItem[];
    }
    return api.get<RequestItem[]>('/api/connections/requests');
  },

  async handleRequest(requestId: string, action: 'block' | 'okay'): Promise<void> {
    if (USE_MOCK) {
      return;
    }
    const endpoint = action === 'okay' ? 'accept' : 'block';
    await api.post(`/api/requests/${requestId}/${endpoint}`);
  },
};
