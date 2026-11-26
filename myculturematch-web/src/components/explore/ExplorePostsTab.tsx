import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { PostCard } from '@/src/components/feed/PostCard';
import type { Post } from '@/src/types/post';

interface ExplorePostsTabProps {
  posts: Post[];
}

/**
 * Onglet "Posts" de la page Explorer : tous les posts du feed
 * (posts partagées par la communauté), style identique au feed.
 */
export const ExplorePostsTab: React.FC<ExplorePostsTabProps> = ({ posts }) => {
  if (posts.length === 0) {
    return (
      <motion.div
        key="posts-tab"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
          <FileText className="w-7 h-7 text-app-gray" />
        </div>
        <h3 className="font-extrabold text-app-black dark:text-white">No posts yet</h3>
        <p className="text-sm text-app-gray mt-1 max-w-sm">
          Shared posts from the community will appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="posts-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-6 max-w-2xl mx-auto w-full pb-6"
    >
      {posts.map((post) => (
        <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <PostCard post={post} />
        </motion.div>
      ))}
    </motion.div>
  );
};
