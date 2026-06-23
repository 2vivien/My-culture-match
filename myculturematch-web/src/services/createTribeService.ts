import createTribeMock from '@/src/mocks/createTribe.json';
import type { TribeTopic, TribeSubmission } from '@/src/types/createTribe';

export const createTribeService = {
  async getTopics(): Promise<TribeTopic[]> {
    return createTribeMock.topics as TribeTopic[];
  },

  async submitTribe(data: TribeSubmission): Promise<{ success: boolean }> {
    // Simulated API call to the backend
    console.log('Tribu created:', data);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  }
};
