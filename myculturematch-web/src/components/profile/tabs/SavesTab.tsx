import React from 'react';
import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PostCard } from '@/src/components/feed/PostCard';
import { api } from '@/src/services/api';
import { mapHydratedPost } from '@/src/lib/postMapper';
import type { Post } from '@/src/types/post';

/**
 * Onglet Enregistrements : vrais posts sauvegardés via /api/posts/saves/list.
 */
export const SavesTab: React.FC = () => {
  const { data: savedPosts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['saves'],
    queryFn: async () => {
      const data = await api.get<{ posts: unknown[] }>('/api/posts/saves/list');
      return (data.posts ?? []).map(mapHydratedPost);
    },
    staleTime: 1000 * 60 * 2,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 max-w-2xl mx-auto w-full"
    >
      <div className="bg-white dark:bg-[#161b22] rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col gap-2 mb-2 text-center">
        <Bookmark className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
        <h3 className="font-black text-[#2e3552] dark:text-white text-lg">Your Saved Posts</h3>
        <p className="text-sm text-[#9aa3b8]">Only you can see what you've saved. Rediscover these posts anytime.</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 rounded-full border-4 border-app-border dark:border-zinc-800 border-t-app-black dark:border-t-white animate-spin" />
        </div>
      )}

      {!isLoading && savedPosts.length === 0 && (
        <div className="text-center py-8 text-sm text-app-gray">
          Aucune post enregistrée. Utilisez « Save this Post » sur un post pour le retrouver ici.
        </div>
      )}

      {savedPosts.map((post) => (
        <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <PostCard post={post} />
        </motion.div>
      ))}
    </motion.div>
  );
};
