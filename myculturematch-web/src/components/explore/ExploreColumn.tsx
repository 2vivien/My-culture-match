import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/src/stores/useUIStore';
import { useExplore } from '@/src/hooks/useExplore';
import { ExploreHeader } from './ExploreHeader';
import { ExploreCategories } from './ExploreCategories';
import { ExploreTribesTab } from './ExploreTribesTab';
import { ExplorePostsTab } from './ExplorePostsTab';
import { ExploreReelsTab } from './ExploreReelsTab';
import { ExploreVideosTab } from './ExploreVideosTab';
import { ExploreSearchResults } from './ExploreSearchResults';
import { useFeed } from '@/src/hooks/useFeed';

export const ExploreColumn: React.FC = () => {
  const { setActiveTab } = useUIStore();
  const { posts } = useFeed();
  const {
    activeSubTab,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    filteredTribes,
    moreTribes,
    filteredPosts,
    filteredVideos,
    toggleJoinTribe,
  } = useExplore(posts);

  const showSearchResults = searchQuery.trim().length >= 2;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none px-1">
      {/* Header with Title & Search bar */}
      <ExploreHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {!showSearchResults ? (
        <>
          {/* Category Pills list */}
          <ExploreCategories
            activeSubTab={activeSubTab}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />

          {/* Main scrollable contents window */}
          <div className="flex-1 overflow-y-auto pr-1 select-none hide-scrollbar">
            <AnimatePresence mode="wait">
              {activeSubTab === 'Tribu' && (
                <ExploreTribesTab
                  filteredTribes={filteredTribes}
                  moreTribes={moreTribes}
                  toggleJoinTribe={toggleJoinTribe}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeSubTab === 'Posts' && (
                <ExplorePostsTab posts={posts} />
              )}

              {activeSubTab === 'Reels' && (
                <ExploreReelsTab />
              )}

              {activeSubTab === 'Vidéo' && (
                <ExploreVideosTab
                  filteredVideos={filteredVideos}
                />
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 select-none hide-scrollbar">
          <ExploreSearchResults query={searchQuery} />
        </div>
      )}
    </div>
  );
};
