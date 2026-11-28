import React from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Newspaper, Landmark } from 'lucide-react';
import { useSearch } from '@/src/hooks/useSearch';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import type { SearchUser, SearchTribe, SearchPost } from '@/src/types/search';

interface ExploreSearchResultsProps {
  query: string;
}

const fallbackAvatar = (seed: string) =>
  `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;

export const ExploreSearchResults: React.FC<ExploreSearchResultsProps> = ({ query }) => {
  const { data, hasQuery, isLoading, error } = useSearch(query);
  const { setSelectedProfileUserId } = useAppStore();
  const { setActiveTab } = useUIStore();

  const openUser = (user: SearchUser) => {
    setSelectedProfileUserId(user.id);
    setActiveTab('Profil');
  };

  if (!hasQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-app-gray select-none">
        <Search className="w-8 h-8 mb-3 opacity-60" />
        <p className="text-sm font-bold">Type at least 2 characters to search</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-app-black dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-app-gray select-none">
        <p className="text-sm font-bold text-red-500">{error.message}</p>
      </div>
    );
  }

  const hasResults = data.users.length > 0 || data.posts.length > 0 || data.tribes.length > 0;

  if (!hasResults) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-app-gray select-none">
        <Search className="w-8 h-8 mb-3 opacity-60" />
        <p className="text-sm font-bold">No results for “{query}”</p>
      </div>
    );
  }

  return (
    <motion.div
      key="search-results"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      {data.users.length > 0 && (
        <section>
          <h3 className="text-xs font-black text-app-gray dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> People
          </h3>
          <div className="bg-white dark:bg-zinc-900/60 rounded-[20px] border border-app-border dark:border-zinc-800 divide-y divide-app-border/40 dark:divide-zinc-800/40 overflow-hidden">
            {data.users.map((user) => (
              <button
                key={user.id}
                onClick={() => openUser(user)}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
              >
                <ProfileAvatar src={user.avatar ?? fallbackAvatar(user.username)} alt={user.name} size="sm" glow="none" />
                <div className="min-w-0">
                  <p className="font-extrabold text-sm text-app-black dark:text-zinc-100 truncate">{user.name}</p>
                  <p className="text-[10px] text-app-gray dark:text-zinc-400 font-bold uppercase tracking-wider truncate">
                    {user.username}{user.country ? ` · ${user.country}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {data.tribes.length > 0 && (
        <section>
          <h3 className="text-xs font-black text-app-gray dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Landmark className="w-3.5 h-3.5" /> Communities
          </h3>
          <div className="bg-white dark:bg-zinc-900/60 rounded-[20px] border border-app-border dark:border-zinc-800 divide-y divide-app-border/40 dark:divide-zinc-800/40 overflow-hidden">
            {data.tribes.map((tribe: SearchTribe) => (
              <button
                key={tribe.id}
                onClick={() => setActiveTab('Tribu')}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
              >
                <ProfileAvatar src={tribe.avatar ?? fallbackAvatar(tribe.name)} alt={tribe.name} size="sm" glow="none" />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-sm text-app-black dark:text-zinc-100 truncate">{tribe.name}</p>
                  <p className="text-[10px] text-app-gray dark:text-zinc-400 font-bold uppercase tracking-wider truncate">
                    {tribe.memberCount} members{tribe.tag ? ` · ${tribe.tag}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {data.posts.length > 0 && (
        <section>
          <h3 className="text-xs font-black text-app-gray dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Newspaper className="w-3.5 h-3.5" /> Posts
          </h3>
          <div className="bg-white dark:bg-zinc-900/60 rounded-[20px] border border-app-border dark:border-zinc-800 divide-y divide-app-border/40 dark:divide-zinc-800/40 overflow-hidden">
            {data.posts.map((post: SearchPost) => (
              <button
                key={post.id}
                onClick={() => setActiveTab('Feed')}
                className="w-full flex flex-col gap-1 px-5 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
              >
                <p className="font-extrabold text-sm text-app-black dark:text-zinc-100 line-clamp-1">
                  {post.title ?? 'Untitled post'}
                </p>
                <p className="text-[10px] text-app-gray dark:text-zinc-400 font-bold uppercase tracking-wider">
                  by {post.authorName} · {post.type}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
};
