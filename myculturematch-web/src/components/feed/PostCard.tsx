import { Post } from '@/src/types/post';
import { PostHeader } from './PostHeader';
import { PostImage } from './PostImage';
import { PostActions } from './PostActions';
import { useFeed } from '@/src/hooks/useFeed';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { Repeat2 } from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export const PostCard = ({ post }: PostCardProps) => {
  const { likePost, isPostLiked } = useFeed();
  const liked = isPostLiked(post.id);
  const setSelectedPostId = useAppStore((s) => s.setSelectedPostId);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  const openPostDetail = (id: string) => {
    setSelectedPostId(id);
    window.location.hash = `#/post/${id}`;
    setActiveTab('PostDetail');
  };

  // ── Repost dont l'original a été supprimé : carte neutre ──
  if (post.type === 'Repost' && !post.originalPost) {
    return (
      <article className="bg-white dark:bg-zinc-950 rounded-[24px] p-5 shadow-soft border border-app-border dark:border-zinc-800">
        <PostHeader author={post.author} date={post.date} tribe={post.tribe} />
        <div className="flex items-center gap-2 mb-3 -mt-1 px-1 text-app-gray">
          <Repeat2 className="w-4 h-4 text-[#E27D60]" />
          <span className="text-xs font-bold">a reposté</span>
        </div>
        <p className="text-sm text-app-gray italic py-4 text-center">Cette publication n'est plus disponible.</p>
      </article>
    );
  }

  // ── Repost : header "X a reposté" + carte du post original ──
  if (post.type === 'Repost' && post.originalPost) {
    const original = post.originalPost;
    const originalLiked = isPostLiked(original.id);

    return (
      <article className="bg-white dark:bg-zinc-950 rounded-[24px] p-5 shadow-soft border border-app-border dark:border-zinc-800 hover:shadow-float transition-all duration-300">
        <PostHeader author={post.author} date={post.date} tribe={post.tribe} />

        {/* Bandeau repost */}
        <div className="flex items-center gap-2 mb-3 -mt-1 px-1 text-app-gray">
          <Repeat2 className="w-4 h-4 text-[#E27D60]" />
          <span className="text-xs font-bold text-app-gray dark:text-zinc-400">
            a reposté dans {post.tribe?.name ?? 'une communauté'}
          </span>
        </div>

        {/* Post original (cliquable) */}
        <div
          onClick={() => openPostDetail(original.id)}
          className="rounded-2xl border border-app-border dark:border-zinc-800 p-4 mb-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <ProfileAvatar
              src={original.author.avatar}
              alt={original.author.name}
              size="xs"
              glow="none"
            />
            <div className="min-w-0">
              <p className="text-xs font-black text-app-black dark:text-zinc-100 truncate">
                {original.author.username || original.author.name}
              </p>
              <p className="text-[10px] text-app-gray truncate">{original.author.location}</p>
            </div>
          </div>
          {original.title && (
            <h4 className="text-sm font-black text-app-black dark:text-zinc-100 leading-snug mb-1">{original.title}</h4>
          )}
          {original.text && (
            <p className="text-sm font-semibold text-app-black dark:text-zinc-300 leading-relaxed line-clamp-4">{original.text}</p>
          )}
          {original.image && (
            <img
              src={original.image}
              alt=""
              className="mt-2 rounded-xl max-h-56 w-full object-cover border border-app-border dark:border-zinc-800"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="flex items-center gap-4 mt-2.5 text-[11px] font-bold text-app-gray">
            <span className="flex items-center gap-1">🚩 {original.likes}</span>
            <span className="flex items-center gap-1">💬 {original.comments}</span>
          </div>
        </div>

        {/* Actions sur le repost lui-même (like/commentaire/rediffusion) */}
        <PostActions
          postId={post.id}
          commentsCount={post.comments ?? 0}
          likes={post.likes}
          liked={liked}
          authorId={post.author?.id}
          onLike={() => likePost(post.id)}
        />
      </article>
    );
  }

  // ── Post classique ──
  return (
    <article className="bg-white dark:bg-zinc-950 rounded-[24px] p-5 shadow-soft border border-app-border dark:border-zinc-800 hover:shadow-float transition-all duration-300">
      <PostHeader author={post.author} date={post.date} tribe={post.tribe} />
      {post.title && (
        <h3 className="text-base font-black text-app-black dark:text-zinc-100 leading-snug mb-1">{post.title}</h3>
      )}
      <p className="text-sm mb-4 font-semibold text-app-black dark:text-zinc-300 leading-relaxed">{post.text}</p>
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

      <PostActions
        postId={post.id}
        commentsCount={post.comments ?? 0}
        likes={post.likes}
        liked={liked}
        authorId={post.author?.id}
        onLike={() => likePost(post.id)}
      />
    </article>
  );
};
