import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { feedService } from '@/src/services/feedService';
import type { Post } from '@/src/types/post';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';

function ago(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (Number.isNaN(diffMin)) return '';
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export const RecentPostsPanel = () => {
  const [cleared, setCleared] = useState(false);
  const { setSelectedPostId } = useAppStore();
  const { setActiveTab } = useUIStore();

  // Même query que le Home : pas de second appel réseau, juste un autre affichage.
  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ['feed', 'Best'],
    queryFn: () => feedService.getPosts('for-you'),
    staleTime: 1000 * 60 * 2,
  });

  const recent = [...posts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <aside className="w-80 hidden xl:flex flex-col shrink-0 h-full overflow-y-auto hide-scrollbar pb-6 pt-2 select-none">
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Recent Posts
          </h2>
          <button
            onClick={() => setCleared(true)}
            className="text-[11px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
          >
            Clear
          </button>
        </div>

        {cleared ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No recent posts.
            <button
              onClick={() => setCleared(false)}
              className="block mx-auto mt-2 font-bold underline cursor-pointer"
            >
              Restore
            </button>
          </div>
        ) : recent.length === 0 ? (
          <p className="py-8 text-center text-xs text-zinc-500">No posts yet.</p>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {recent.map((post) => (
              <button
                key={post.id}
                onClick={() => {
                  setSelectedPostId(post.id);
                  setActiveTab('PostDetail');
                }}
                className="w-full text-left py-3 flex gap-3 cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 min-w-0">
                    <ProfileAvatar
                      src={post.author.avatar}
                      alt={post.author.name}
                      size="xs"
                      glow="none"
                    />
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {post.author.username || post.author.name}
                    </span>
                    <span>•</span>
                    <span className="shrink-0">{ago(post.createdAt)}</span>
                  </div>
                  <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 leading-snug mt-1.5 line-clamp-2 group-hover:underline">
                    {post.title || post.text}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    {post.likes} upvotes · {post.comments} comments
                  </p>
                </div>
                {post.image && (
                  <img
                    src={post.image}
                    alt=""
                    className="w-14 h-14 rounded-md object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
