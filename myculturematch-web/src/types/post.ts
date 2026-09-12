export interface PostAuthor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  location: string;
}

export interface Post {
  id: string;
  author: PostAuthor;
  text: string;
  /** Titre renvoyé par le backend (traditions). */
  title?: string;
  image?: string;
  likes: number;
  comments: number;
  views: number;
  date: string;
  createdAt: string;
  tribe?: { id: string; name: string };
  tags?: string[];
  likedByMe?: boolean;
  /** Type de post ('Repost' pour un repost). */
  type?: string;
  /** Post original hydraté si type=Repost. */
  originalPost?: Post | null;
}
