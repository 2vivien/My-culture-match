export interface Message {
  id: string;
  name: string;
  username: string;
  role: string;
  img: string;
  notificationsOn: boolean;
  lastMessage?: string;
  unreadCount: number;
}
