import createTraditionMock from '@/src/mocks/createTradition.json';
import type { TribeOption, TraditionSubmission } from '@/src/types/createTradition';

export const traditionService = {
  async getTribes(): Promise<TribeOption[]> {
    return createTraditionMock.tribes as TribeOption[];
  },
  
  async submitTradition(data: TraditionSubmission): Promise<{ success: boolean }> {
    // In a real app, this would send the request to a REST API.
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Tradition submitted:', data);
        resolve({ success: true });
      }, 500);
    });
  }
};
