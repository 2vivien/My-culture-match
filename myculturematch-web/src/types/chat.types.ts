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

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text?: string;
  img?: string;
  audioDur?: string;
  file?: { name: string; size: string };
  sticker?: string;
  time: string;
  isRead?: boolean;
}
