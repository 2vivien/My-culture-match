export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  culture: string;
  lang: string;
  online: boolean;
  lastSeen?: string;
  lastMsg: string;
  timeAgo: string;
  unreadCount: number;
  glow: string;
  level: number;
  bio: string;
  country: string;
  traditions: string[];
  tribes: string[];
  sharedMedia: string[];
}

export interface ChatReaction {
  userId: string;
  reaction: string;
}

export interface ChatReplyPreview {
  id: string;
  text: string | null;
  senderId: string;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  senderId: string;
  senderName: string;
  text?: string;
  img?: string;
  audioDur?: string | number;
  file?: { name: string; size: string | number };
  sticker?: string;
  time: string;
  createdAt?: string;
  isRead?: boolean;
  editedAt?: string | null;
  deleted?: boolean;
  replyToId?: string | null;
  reply?: ChatReplyPreview | null;
  reactions?: ChatReaction[];
  pinned?: boolean;
}
