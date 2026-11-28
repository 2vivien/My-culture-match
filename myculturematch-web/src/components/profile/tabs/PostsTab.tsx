import React from 'react';
import { motion } from 'framer-motion';
import { PostCard } from '@/src/components/feed/PostCard';
import type { Post } from '@/src/types/post';

interface PostsTabProps {
  user: any;
  posts: Post[];
}

export const PostsTab: React.FC<PostsTabProps> = ({ user, posts }) => {
  const userPosts = posts.filter(p => p.author.id === user.id);

  if (userPosts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-16 text-center max-w-2xl mx-auto w-full"
      >
        <p className="text-sm font-bold text-app-black dark:text-zinc-200">Aucune post publiée pour le moment</p>
        <p className="text-xs text-app-gray mt-1.5 max-w-sm">
          Les posts que vous partagerez apparaîtront ici. Lancez-vous avec le bouton « Create » !
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 max-w-2xl mx-auto w-full"
    >
      {userPosts.map((post) => (
        <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <PostCard post={post} />
        </motion.div>
      ))}
    </motion.div>
  );
};
