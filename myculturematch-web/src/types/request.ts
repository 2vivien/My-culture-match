export interface RequestItem {
  id: string;
  name: string;
  avatar: string;
  actionText: string;
  timeAgo: string;
  badgeType?: 'heart' | 'star' | 'comment' | 'user';
  connectionsCount?: number;
  connectedCount?: number;
}
