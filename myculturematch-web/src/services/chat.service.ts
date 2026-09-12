import { Conversation, ChatMessage } from '../types/chat.types';
import { api } from './api';

/**
 * Adaptation des formes backend aux types du front :
 * - GET /api/conversations → ConversationSummary[] (participant = l'autre user)
 * - GET /api/conversations/:id/messages → { messages, nextCursor }
 * - POST /api/conversations/:id/messages → ChatMessageDto
 * - POST /api/conversations/:id/read → marque la conversation comme lue
 */

interface BackendParticipant {
  id: string;
  name: string;
  username?: string;
  avatar: string | null;
}

interface BackendConversationSummary {
  id: string;
  name: string;
  avatar: string | null;
  isGroup: boolean;
  online: boolean;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
  participant: BackendParticipant | null;
}

interface BackendChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  type: string;
  text: string | null;
  mediaUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fallbackAvatarFor(seed: string): string {
  return `https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(seed)}`;
}

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const list = await api.get<BackendConversationSummary[]>('/api/conversations');
    return (list ?? []).map((c) => {
      const other = c.participant;
      return {
        id: c.id,
        name: other?.name ?? c.name ?? 'Conversation',
        avatar: other?.avatar ?? fallbackAvatarFor(c.id),
        culture: other?.username ? `@${other.username}` : '',
        lang: '',
        online: Boolean(c.online),
        lastMsg: c.lastMessage ?? '',
        timeAgo: timeAgo(c.lastMessageAt),
        unreadCount: c.unreadCount ?? 0,
        glow: 'orange',
        level: 1,
        bio: '',
        country: '',
        traditions: [],
        tribes: [],
        sharedMedia: [],
      } satisfies Conversation;
    });
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const data = await api.get<{ messages: BackendChatMessage[]; nextCursor: string | null }>(
      `/api/conversations/${conversationId}/messages?limit=50`,
    );
    // Le backend renvoie desc — on remet en ordre chronologique.
    return [...(data.messages ?? [])].reverse().map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName || 'Membre',
      text: m.text ?? undefined,
      img: m.mediaUrl ?? undefined,
      time: timeOf(m.createdAt),
      isRead: m.isRead,
    })) satisfies ChatMessage[];
  },

  async sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
    const m = await api.post<BackendChatMessage>(`/api/conversations/${conversationId}/messages`, { type: 'text', text });
    return {
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderName || 'Moi',
      text: m.text ?? undefined,
      img: m.mediaUrl ?? undefined,
      time: timeOf(m.createdAt),
      isRead: m.isRead,
    };
  },

  /** POST /api/conversations/:id/read — reset unreadCount côté backend. */
  async markRead(conversationId: string): Promise<void> {
    try {
      await api.post(`/api/conversations/${conversationId}/read`);
    } catch {
      // non bloquant
    }
  },

  /**
   * POST /api/conversations — crée (ou rejoint) la conversation 1:1 avec un
   * utilisateur donné (partage de post, démarrage de discussion).
   */
  async ensureConversationWith(userId: string): Promise<{ id: string }> {
    return api.post<{ id: string }>('/api/conversations', { participantId: userId });
  },
};
