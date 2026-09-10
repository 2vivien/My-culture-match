import { Conversation, ChatMessage } from '../types/chat.types';
import { api } from './api';

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    return api.get<Conversation[]>('/api/conversations');
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const data = await api.get<ChatMessage[] | { messages: ChatMessage[] }>(`/api/conversations/${conversationId}/messages`);
    return Array.isArray(data) ? data : (data.messages ?? []);
  },

  async sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
    return api.post<ChatMessage>(`/api/conversations/${conversationId}/messages`, { text });
  },
};
