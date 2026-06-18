import requestsMock from '@/src/mocks/requests.json';
import type { RequestItem } from '@/src/types/request';

const USE_MOCK = true;
const API_BASE = '';

export const requestsService = {
  async getRequests(): Promise<RequestItem[]> {
    if (USE_MOCK) {
      return requestsMock as RequestItem[];
    }
    const res = await fetch(`${API_BASE}/api/requests`);
    if (!res.ok) throw new Error('Failed to fetch requests');
    return res.json() as Promise<RequestItem[]>;
  },

  async handleRequest(requestId: string, action: 'block' | 'okay'): Promise<void> {
    if (USE_MOCK) {
      return;
    }
    await fetch(`${API_BASE}/api/requests/${requestId}/${action}`, { method: 'POST' });
  },
};
