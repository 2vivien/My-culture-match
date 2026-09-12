export interface NotificationItem {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
    action: string;
    target: string;
    subText?: string;
  };
  type: 'comment' | 'invite' | 'like' | 'generation';
  time: string;
  isUnread?: boolean;
}
