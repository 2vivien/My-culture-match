import { api } from './api';

export type TemporalMessageType = 'text' | 'image' | 'voice' | 'file';

export interface TemporalMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  type: TemporalMessageType;
  text: string | null;
  mediaUrl: string | null;
  audioDur: number | null;
  file: Record<string, unknown> | null;
  revealAt: string;
  revealedAt: string | null;
  createdAt: string;
  status: 'pending' | 'revealed' | 'cancelled';
}

export const temporalMessageService = {
  schedule(conversationId: string, input: { text?: string; type?: TemporalMessageType; mediaUrl?: string; audioDur?: number; file?: Record<string, unknown>; revealAt: string }) {
    return api.post<TemporalMessage>(`/api/conversations/${conversationId}/temporal-messages`, input);
  },
  list(conversationId: string) {
    return api.get<{ sent: TemporalMessage[]; lockedCount: number }>(`/api/conversations/${conversationId}/temporal-messages`);
  },
  cancel(conversationId: string, temporalMessageId: string) {
    return api.delete<{ success: true }>(`/api/conversations/${conversationId}/temporal-messages/${temporalMessageId}`);
  },
};
