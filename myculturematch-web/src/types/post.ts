export interface PostAuthor {
  id: string;
  name: string;
  avatar: string;
  location: string;
}

export interface Post {
  id: string;
  author: PostAuthor;
  text: string;
  image?: string;
  likes: number;
  comments: number;
  views: number;
  date: string;
  createdAt: string;
  tribe?: { id: string; name: string };
  tags?: string[];
}
