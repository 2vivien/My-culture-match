import React from 'react';
import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { PostCard } from '@/src/components/feed/PostCard';
import type { Post } from '@/src/types/post';

interface SavesTabProps {
  posts: Post[];
}

export const SavesTab: React.FC<SavesTabProps> = ({ posts }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 max-w-2xl mx-auto w-full"
    >
      <div className="bg-[#E27D60]/10 dark:bg-[#E27D60]/5 rounded-2xl p-6 border border-[#E27D60]/20 flex flex-col gap-2 mb-2 text-center">
        <Bookmark className="w-8 h-8 text-[#E27D60] mx-auto mb-2" />
        <h3 className="font-black text-[#2e3552] dark:text-white text-lg">Your Saved Traditions</h3>
        <p className="text-sm text-[#9aa3b8]">Only you can see what you've saved. Rediscover these traditions anytime.</p>
      </div>
      {posts.slice(0, 2).map((post) => (
        <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <PostCard post={post} />
        </motion.div>
      ))}
    </motion.div>
  );
};
