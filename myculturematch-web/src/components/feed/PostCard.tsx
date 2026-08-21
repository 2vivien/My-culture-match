import { Post } from '@/src/types/post';
import { PostHeader } from './PostHeader';
import { PostImage } from './PostImage';
import { PostActions } from './PostActions';
import { useFeed } from '@/src/hooks/useFeed';

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const { likePost, isPostLiked } = useFeed();
  const liked = isPostLiked(post.id);

  return (
    <article className="bg-white dark:bg-zinc-950 rounded-[24px] p-5 shadow-soft border border-app-border dark:border-zinc-850 hover:shadow-float transition-all duration-300">
      <PostHeader author={post.author} date={post.date} tribe={post.tribe} />
      <p className="text-sm mb-4 font-semibold text-app-black dark:text-zinc-150 leading-relaxed">{post.text}</p>
      <PostImage
        image={post.image}
        likes={post.likes}
        views={post.views}
        liked={liked}
        onLike={() => likePost(post.id)}
      />
      
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 mb-1 px-1 select-none">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs font-black text-[#E27D60] hover:underline cursor-pointer">
              {tag}
            </span>
          ))}
        </div>
      )}

      <PostActions likes={post.likes} liked={liked} onLike={() => likePost(post.id)} />
    </article>
  );
};
