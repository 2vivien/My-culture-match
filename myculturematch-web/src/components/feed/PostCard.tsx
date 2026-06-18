import { Post } from '@/src/types/post';
import { PostHeader } from './PostHeader';
import { PostImage } from './PostImage';
import { PostActions } from './PostActions';
import { useFeed } from '@/src/hooks/useFeed';

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const { likePost } = useFeed();

  return (
    <article className="bg-white dark:bg-zinc-950 rounded-[24px] p-5 shadow-soft border border-app-border dark:border-zinc-850 hover:shadow-float transition-all duration-300">
      <PostHeader author={post.author} date={post.date} />
      <p className="text-sm mb-4 font-semibold text-app-black dark:text-zinc-150 leading-relaxed">{post.text}</p>
      <PostImage
        image={post.image}
        likes={post.likes}
        views={post.views}
        onLike={() => likePost(post.id)}
      />
      <PostActions likes={post.likes} onLike={() => likePost(post.id)} />
    </article>
  );
};
