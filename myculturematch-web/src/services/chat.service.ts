import { Conversation, ChatMessage, ChatReaction } from '../types/chat.types';
import { api } from './api';

interface BackendParticipant { id: string; name: string; username?: string; avatar: string | null; }
interface BackendConversationSummary { id: string; name: string; avatar: string | null; isGroup: boolean; online: boolean; lastMessage: string | null; lastMessageAt: string; unreadCount: number; participant: BackendParticipant | null; }
interface BackendChatMessage { id: string; conversationId?: string; senderId: string; senderName: string; type: string; text: string | null; mediaUrl: string | null; audioDur?: number | null; file?: { name: string; size: number } | null; isRead: boolean; createdAt: string; editedAt?: string | null; replyToId?: string | null; reply?: { id: string; text: string | null; senderId: string } | null; reactions?: ChatReaction[]; }

function timeAgo(iso: string): string { const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000); if (mins < 1) return 'now'; if (mins < 60) return `${mins}m`; const hours = Math.floor(mins / 60); if (hours < 24) return `${hours}h`; const days = Math.floor(hours / 24); if (days < 7) return `${days}d`; return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); }
function timeOf(iso: string): string { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function fallbackAvatarFor(seed: string): string { return `https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(seed)}`; }
function mapMessage(m: BackendChatMessage): ChatMessage { return { id: m.id, conversationId: m.conversationId, senderId: m.senderId, senderName: m.senderName || 'Membre', text: m.text ?? undefined, img: m.mediaUrl ?? undefined, audioDur: m.audioDur ?? undefined, file: m.file ? { name: m.file.name, size: m.file.size } : undefined, time: timeOf(m.createdAt), createdAt: m.createdAt, isRead: m.isRead, editedAt: m.editedAt ?? null, replyToId: m.replyToId ?? null, reply: m.reply ?? null, reactions: m.reactions ?? [] }; }

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const list = await api.get<BackendConversationSummary[]>('/api/conversations');
    return (list ?? []).map((c) => { const other = c.participant; return { id: c.id, name: other?.name ?? c.name ?? 'Conversation', avatar: other?.avatar ?? fallbackAvatarFor(c.id), culture: other?.username ? `@${other.username}` : '', lang: '', online: Boolean(c.online), lastMsg: c.lastMessage ?? '', timeAgo: timeAgo(c.lastMessageAt), unreadCount: c.unreadCount ?? 0, glow: 'orange', level: 1, bio: '', country: '', traditions: [], tribes: [], sharedMedia: [] } satisfies Conversation; });
  },
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const data = await api.get<{ messages: BackendChatMessage[]; nextCursor: string | null }>(`/api/conversations/${conversationId}/messages/enhanced?limit=50`);
      return [...(data.messages ?? [])].reverse().map(mapMessage);
    } catch {
      const data = await api.get<{ messages: BackendChatMessage[]; nextCursor: string | null }>(`/api/conversations/${conversationId}/messages?limit=50`);
      return [...(data.messages ?? [])].reverse().map(mapMessage);
    }
  },
  async sendMessage(conversationId: string, text: string, replyToId?: string): Promise<ChatMessage> {
    const m = replyToId
      ? await api.post<BackendChatMessage>(`/api/conversations/${conversationId}/messages/reply`, { type: 'text', text, replyToId })
      : await api.post<BackendChatMessage>(`/api/conversations/${conversationId}/messages`, { type: 'text', text });
    return mapMessage(m);
  },
  async editMessage(conversationId: string, messageId: string, text: string): Promise<void> { await api.patch(`/api/conversations/${conversationId}/messages/${messageId}`, { text }); },
  async deleteMessage(conversationId: string, messageId: string): Promise<void> { await api.delete(`/api/conversations/${conversationId}/messages/${messageId}`); },
  async toggleReaction(conversationId: string, messageId: string, reaction: string): Promise<{ active: boolean }> { return api.post(`/api/conversations/${conversationId}/messages/${messageId}/reactions`, { reaction }); },
  async setTyping(conversationId: string, typing: boolean): Promise<void> { try { await api.post(`/api/conversations/${conversationId}/typing`, { typing }); } catch { /* typing is best effort */ } },
  async pinMessage(conversationId: string, messageId: string, pinned: boolean): Promise<void> { await api.post(`/api/conversations/${conversationId}/messages/${messageId}/pin`, { pinned }); },
  async getPins(conversationId: string): Promise<Array<{ messageId: string; pinnedBy: string; text: string | null }>> { return api.get(`/api/conversations/${conversationId}/pins`); },
  async markRead(conversationId: string): Promise<void> { try { await api.post(`/api/conversations/${conversationId}/read`); } catch { /* non bloquant */ } },
  async ensureConversationWith(userId: string): Promise<{ id: string }> { return api.post<{ id: string }>('/api/conversations', { participantId: userId }); },
};
