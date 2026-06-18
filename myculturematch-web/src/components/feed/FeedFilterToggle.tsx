import { useAppStore } from '@/src/stores/useAppStore';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';

export const FeedFilterToggle = () => {
  const { feedFilter, setFeedFilter } = useAppStore();

  return (
    <div className="flex justify-center mb-2 select-none">
      <div className="bg-white dark:bg-zinc-950 p-1 rounded-full shadow-soft border border-app-border dark:border-zinc-850 inline-flex items-center gap-1">
        <button
          onClick={() => setFeedFilter('following')}
          className={cn(
            'px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer relative',
            feedFilter === 'following' ? 'text-white dark:text-app-black' : 'text-app-gray hover:text-app-black dark:hover:text-zinc-300'
          )}
        >
          {feedFilter === 'following' && (
            <motion.div
              layoutId="feed-filter-bg"
              className="absolute inset-0 bg-app-black dark:bg-white rounded-full -z-10"
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            />
          )}
          Following
        </button>

        <button
          onClick={() => setFeedFilter('for-you')}
          className={cn(
            'px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer relative',
            feedFilter === 'for-you' ? 'text-white dark:text-app-black' : 'text-app-gray hover:text-app-black dark:hover:text-zinc-300'
          )}
        >
          {feedFilter === 'for-you' && (
            <motion.div
              layoutId="feed-filter-bg"
              className="absolute inset-0 bg-app-black dark:bg-white rounded-full -z-10"
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            />
          )}
          For you
        </button>
      </div>
    </div>
  );
};
