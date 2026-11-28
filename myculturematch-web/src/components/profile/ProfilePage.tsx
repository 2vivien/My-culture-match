import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, MessageCircle, Bookmark } from 'lucide-react';
import { useProfile } from '@/src/hooks/useProfile';
import { useUIStore } from '@/src/stores/useUIStore';
import { useFeed } from '@/src/hooks/useFeed';
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs } from './ProfileTabs';
import { ProfileCompletionPanel } from './ProfileCompletionPanel';
import { PostsTab } from './tabs/PostsTab';
import { CommentsTab } from './tabs/CommentsTab';
import { SavesTab } from './tabs/SavesTab';

export const ProfilePage: React.FC = () => {
  const { openChat } = useUIStore();
  const { posts } = useFeed();
  const {
    user,
    activeTab,
    setActiveTab,
    connectionState,
    toggleConnection,
    getCountryCode,
    isOwnProfile,
  } = useProfile();

  const profileTabs = [
    { id: 'Posts', icon: FileText, label: 'Posts' },
    { id: 'Comments', icon: MessageCircle, label: 'Comments' },
    { id: 'Saved', icon: Bookmark, label: 'Saved' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col h-full overflow-y-auto hide-scrollbar max-w-[1000px] mx-auto w-full gap-4 pb-20"
    >
      <ProfileHeader
        user={user}
        connectionState={connectionState}
        onToggleConnection={toggleConnection}
        onSendMessage={openChat}
        getCountryCode={getCountryCode}
      />

      {isOwnProfile && <ProfileCompletionPanel />}

      <ProfileTabs tabs={profileTabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'Posts' && <PostsTab key="posts" user={user} posts={posts} />}
          {activeTab === 'Comments' && <CommentsTab key="comments" user={user} posts={posts} />}
          {activeTab === 'Saved' &&
            (isOwnProfile ? (
              <SavesTab key="saved" />
            ) : (
              <div key="saved-private" className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-12 text-center">
                <Bookmark className="w-7 h-7 mx-auto mb-3 text-zinc-400" />
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Saved posts are private.</p>
              </div>
            ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
