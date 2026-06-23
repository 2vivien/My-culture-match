export interface PostItem {
  id: string;
  author: string;
  timeAgo: string;
  title: string;
  tagText: string;
  tagColor: string;
  mediaUrl?: string;
  upvotes: number;
  commentsCount: number;
  hasUpvoted?: boolean;
}

export interface TribeRule {
  number: number;
  title: string;
  desc: string;
}

export interface TribeModerator {
  name: string;
  role: string;
  avatar: string;
}
