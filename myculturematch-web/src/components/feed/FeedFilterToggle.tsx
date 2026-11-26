import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/src/stores/useAppStore';
import { cn } from '@/src/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '@/src/stores/useUIStore';
import { launchThemes, feedThemeOptions } from '@/src/lib/themes';
import { Play } from 'lucide-react';

const sortOptions = ['Best', 'Popular', 'New', 'Hot'];
const themeOptions = feedThemeOptions;

export const FeedFilterToggle = () => {
  const { feedSort, feedCulture, setFeedSort, setFeedCulture } = useAppStore();
  const { activeTab } = useUIStore();
  const isSortDisabled = activeTab === 'Popular' || activeTab === 'New';
  const [openSort, setOpenSort] = useState(false);
  const [openCulture, setOpenCulture] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const cultureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setOpenSort(false);
      if (cultureRef.current && !cultureRef.current.contains(e.target as Node)) setOpenCulture(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-wrap justify-start mb-4 select-none gap-2 px-1 relative z-30">
      {/* Sort Custom Select */}
      <div className="relative" ref={sortRef}>
        <button
          onClick={() => {
            if (!isSortDisabled) {
              setOpenSort(!openSort);
              setOpenCulture(false);
            }
          }}
          className={cn(
            "bg-white dark:bg-zinc-950 px-4 py-2 rounded-full shadow-sm border border-app-border dark:border-zinc-800 text-sm font-bold text-app-black dark:text-white transition-all focus:outline-none",
            isSortDisabled ? "cursor-default opacity-85" : "hover:shadow-md cursor-pointer"
          )}
        >
          <span className="flex items-center gap-1.5">
            {isSortDisabled ? activeTab : feedSort}
            <Play className={cn('w-3 h-3 rotate-90 text-app-gray', openSort && 'rotate-[270deg]')} />
          </span>
        </button>

        {!isSortDisabled && (
          <AnimatePresence>
            {openSort && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-2 w-40 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-app-border dark:border-zinc-800 overflow-hidden py-2 z-50"
              >
                {sortOptions.map(option => (
                  <div
                    key={option}
                    onClick={() => { setFeedSort(option); setOpenSort(false); }}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold cursor-pointer",
                      feedSort === option
                        ? "bg-zinc-100 dark:bg-zinc-800 text-app-black dark:text-white"
                        : "text-app-black dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    {option}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Culture Custom Select */}
      <div className="relative" ref={cultureRef}>
        <button
          onClick={() => { setOpenCulture(!openCulture); setOpenSort(false); }}
          className="bg-white dark:bg-zinc-950 px-4 py-2 rounded-full shadow-sm border border-app-border dark:border-zinc-800 text-sm font-bold text-app-black dark:text-white hover:shadow-md transition-all focus:outline-none"
        >
          <span className="flex items-center gap-1.5">
            {feedCulture}
            <Play className={cn('w-3 h-3 rotate-90 text-app-gray', openCulture && 'rotate-[270deg]')} />
          </span>
        </button>

        <AnimatePresence>
          {openCulture && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-72 max-h-72 overflow-y-auto no-scrollbar bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-app-border dark:border-zinc-800 py-2 z-50"
            >
              {themeOptions.map(option => (
                <div
                  key={option}
                  onClick={() => { setFeedCulture(option); setOpenCulture(false); }}
                  className={cn(
                    "px-4 py-2 text-sm font-semibold cursor-pointer",
                    feedCulture === option
                      ? "bg-zinc-100 dark:bg-zinc-800 text-app-black dark:text-white"
                      : "text-app-black dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  {option}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
