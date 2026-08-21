import { motion, AnimatePresence } from 'framer-motion';
import { useFeed } from '@/src/hooks/useFeed';
import { FeedFilterToggle } from './FeedFilterToggle';

import { useUIStore } from '@/src/stores/useUIStore';
import { PostCard } from './PostCard';
import { fadeInUp, staggerChildren } from '@/src/lib/animations';

export const MainFeedColumn = () => {
  const { posts, isLoading } = useFeed();
  const { activeTab } = useUIStore();

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col gap-6 overflow-y-auto hide-scrollbar pb-10">
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
          className="flex flex-col gap-6"
        >
          <AnimatePresence mode="popLayout">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                variants={fadeInUp}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <PostCard post={post} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </main>
  );
};
