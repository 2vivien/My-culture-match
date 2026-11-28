import { motion } from 'framer-motion';
import { useFeed } from '@/src/hooks/useFeed';
import { FeedFilterToggle } from './FeedFilterToggle';
import { PostCard } from './PostCard';
import { fadeInUp, staggerChildren } from '@/src/lib/animations';

export const MainFeedColumn = () => {
  const { posts, isLoading } = useFeed();

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col min-h-0 pb-6">
      <FeedFilterToggle />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 rounded-full border-4 border-app-border dark:border-zinc-800 border-t-app-black dark:border-t-white animate-spin" />
        </div>
      ) : (
        <motion.div
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
          className="flex-1 min-h-0 overflow-y-auto hide-scrollbar bg-white dark:bg-zinc-950 rounded-xl border border-app-border dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800"
        >
          {posts.map((post) => (
            <motion.div key={post.id} variants={fadeInUp} layout>
              <PostCard post={post} flat />
            </motion.div>
          ))}
          {posts.length === 0 && (
            <p className="py-16 text-center text-sm text-zinc-500">No posts yet.</p>
          )}
        </motion.div>
      )}
    </main>
  );
};
