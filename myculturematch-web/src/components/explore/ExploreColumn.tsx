import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/src/stores/useUIStore';
import { useExplore } from '@/src/hooks/useExplore';
import { ExploreHeader } from './ExploreHeader';
import { ExploreTabs } from './ExploreTabs';
import { ExploreCategories } from './ExploreCategories';
import { ExploreTribesTab } from './ExploreTribesTab';
import { ExploreConnectionsTab } from './ExploreConnectionsTab';
import { ExploreImagesTab } from './ExploreImagesTab';
import { ExploreVideosTab } from './ExploreVideosTab';
import { ExploreLightbox } from './ExploreLightbox';

export const ExploreColumn: React.FC = () => {
  const { setActiveTab } = useUIStore();
  const {
    activeSubTab,
    setActiveSubTab,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    lightboxImage,
    setLightboxImage,
    filteredTribes,
    moreTribes,
    filteredCompanions,
    filteredImages,
    filteredVideos,
    toggleJoinTribe,
    toggleConnectCompanion,
  } = useExplore();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none px-1">
      {/* Header with Title & Search bar */}
      <ExploreHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Sub-tabs switchers */}
      <ExploreTabs
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        setActiveCategory={setActiveCategory}
      />

      {/* Category Pills list */}
      {activeSubTab !== 'Connexion' && (
        <ExploreCategories
          activeSubTab={activeSubTab}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      )}

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

          {activeSubTab === 'Connexion' && (
            <ExploreConnectionsTab
              filteredCompanions={filteredCompanions}
              toggleConnectCompanion={toggleConnectCompanion}
            />
          )}

          {activeSubTab === 'Images' && (
            <ExploreImagesTab
              filteredImages={filteredImages}
              setLightboxImage={setLightboxImage}
            />
          )}

          {activeSubTab === 'Vidéo' && (
            <ExploreVideosTab
              filteredVideos={filteredVideos}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen image viewer */}
      <ExploreLightbox
        lightboxImage={lightboxImage}
        setLightboxImage={setLightboxImage}
      />
    </div>
  );
};
