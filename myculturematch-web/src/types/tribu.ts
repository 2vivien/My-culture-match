export interface PostItem {
  id: string;
  author: string;
  timeAgo: string;
  title: string;
  tagText: string;
  tagColor: string;
  body?: string;
  mediaUrl?: string;
  tags?: string[];
  upvotes: number;
  commentsCount: number;
  hasUpvoted?: boolean;
  /** Flair de la tribu (couleur déjà validée #RRGGBB). */
  flair?: { id: string; name: string; color: string } | null;
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
