import { Post } from '@/src/types/post';
import { PostHeader } from './PostHeader';
import { PostImage } from './PostImage';
import { PostActions } from './PostActions';
import { useFeed } from '@/src/hooks/useFeed';
import { navigate } from '@/src/lib/router';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { Repeat2 } from 'lucide-react';

interface PostCardProps {
  post: Post;
  /** Feed : une seule carte contient tous les posts, donc pas de chrome individuel. */
  flat?: boolean;
}

export const PostCard = ({ post, flat = false }: PostCardProps) => {
  const { likePost, isPostLiked } = useFeed();
  const liked = isPostLiked(post.id);

  const openPostDetail = (id: string) => navigate('PostDetail', id);

  const cardClass = flat
    ? 'px-5 py-5 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors'
    : 'bg-white dark:bg-zinc-950 rounded-[24px] p-5 shadow-soft border border-app-border dark:border-zinc-800 hover:shadow-float transition-all duration-300';

  // ── Repost dont l'original a été supprimé : carte neutre ──
  if (post.type === 'Repost' && !post.originalPost) {
    return (
      <article className={cardClass}>
        <PostHeader author={post.author} date={post.date} tribe={post.tribe} />
        <div className="flex items-center gap-2 mb-3 -mt-1 px-1 text-app-gray">
          <Repeat2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
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
      <article className={cardClass}>
        <PostHeader author={post.author} date={post.date} tribe={post.tribe} />

        {/* Bandeau repost */}
        <div className="flex items-center gap-2 mb-3 -mt-1 px-1 text-app-gray">
          <Repeat2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
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
    <article className={cardClass}>
      <PostHeader author={post.author} date={post.date} tribe={post.tribe} />
      {post.title && (
        <h3
          onClick={() => openPostDetail(post.id)}
          className="text-base font-black text-app-black dark:text-zinc-100 leading-snug mb-1 cursor-pointer select-text hover:underline"
        >
          {post.title}
        </h3>
      )}
      <p
        onClick={() => openPostDetail(post.id)}
        className="text-sm mb-4 font-semibold text-app-black dark:text-zinc-300 leading-relaxed cursor-pointer select-text"
      >
        {post.text}
        {post.tags && post.tags.length > 0 && (
          <span className="ml-1.5 text-zinc-500 dark:text-zinc-400 font-bold">
            {post.tags.slice(0, 3).map((tag) => `#${tag}`).join(' ')}
          </span>
        )}
      </p>
      <PostImage
        image={post.image}
        likes={post.likes}
        views={post.views}
        liked={liked}
        onLike={() => likePost(post.id)}
      />
      
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
