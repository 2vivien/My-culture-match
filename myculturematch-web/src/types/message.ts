export interface Message {
  id: string;
  name: string;
  role: string;
  img: string;
  notificationsOn: boolean;
  lastMessage?: string;
}
