import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Images, SquarePlay, Info, Bookmark } from 'lucide-react';
import { useTotemProfile } from '@/src/hooks/useTotemProfile';
import { useUIStore } from '@/src/stores/useUIStore';
import { useFeed } from '@/src/hooks/useFeed';
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs } from './ProfileTabs';
import { ProfileCompletionPanel } from '@/src/components/profile/ProfileCompletionPanel';
import { PostsTab } from './tabs/PostsTab';
import { PhotosTab } from './tabs/PhotosTab';
import { VideosTab } from './tabs/VideosTab';
import { AboutTab } from './tabs/AboutTab';
import { SavesTab } from './tabs/SavesTab';

export const TotemProfile: React.FC = () => {
  const { openChat } = useUIStore();
  const { posts } = useFeed();
  const {
    user,
    activeTab,
    setActiveTab,
    connectionState,
    toggleConnection,
    getCountryCode,
    getCityAndCountry,
    isOwnProfile,
  } = useTotemProfile();

  const handleSendMessage = () => {
    openChat();
  };

  const profileTabs = [
    { id: 'Posts', icon: FileText, label: 'Traditions' },
    { id: 'Photos', icon: Images, label: 'Photos' },
    { id: 'Videos', icon: SquarePlay, label: 'Vidéos' },
    { id: 'About', icon: Info, label: 'À propos' },
    // Save : les posts enregistrés — uniquement sur son propre profil.
    ...(isOwnProfile ? [{ id: 'Saves', icon: Bookmark, label: 'Save' }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar max-w-[1200px] mx-auto w-full gap-6 pb-20"
      style={{
        '--color-primary': '#6c63fc',
        '--color-primary-dark': '#5a52e0',
        '--color-secondary': '#2dd9d9',
        '--gradient-btn-primary': 'linear-gradient(135deg, #8b7af9 0%, #6c63fc 100%)',
        '--gradient-btn-secondary': 'linear-gradient(135deg, #34e0e0 0%, #1fc8cf 100%)',
      } as any}
    >
      <ProfileHeader
        user={user}
        connectionState={connectionState}
        onToggleConnection={toggleConnection}
        onSendMessage={handleSendMessage}
        getCountryCode={getCountryCode}
      />

      {isOwnProfile && <ProfileCompletionPanel />}

      <ProfileTabs
        tabs={profileTabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'Posts' && (
            <PostsTab key="posts" user={user} posts={posts} />
          )}

          {activeTab === 'Photos' && (
            <PhotosTab key="photos" posts={posts} />
          )}

          {activeTab === 'Videos' && (
            <VideosTab key="videos" posts={posts} />
          )}

          {activeTab === 'About' && (
            <AboutTab
              key="about"
              user={user}
              getCityAndCountry={getCityAndCountry}
            />
          )}

          {activeTab === 'Saves' && isOwnProfile && (
            <SavesTab key="saves" posts={posts} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
