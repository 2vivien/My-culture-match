import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, MessageCircle, SquarePlus, Search } from 'lucide-react';
import { SearchBar } from './parts/SearchBar';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { UserProfileDropdown } from './parts/UserProfileDropdown';
import { useUnreadMessagesCount } from '@/src/hooks/useUnreadMessagesCount';

import { AnimatePresence } from 'framer-motion';

export const Header = () => {
  const { toggleSidebar, notificationsCount, setActiveTab, openChat } = useUIStore();
  const { currentUser } = useAppStore();
  const { data: unreadMessages } = useUnreadMessagesCount();

  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const iconButton =
    'w-10 h-10 flex items-center justify-center text-app-black dark:text-zinc-100 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors cursor-pointer relative shrink-0';
  const badge =
    'absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center bg-[#E27D60] text-[9px] font-black text-white';

  return (
    <header className="h-20 md:h-24 px-4 sm:px-6 md:px-10 flex items-center justify-between gap-4 shrink-0 bg-[#FEFEFE]/85 dark:bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-40 w-full border-b border-app-border/40 dark:border-zinc-800/40">
      <button
        onClick={toggleSidebar}
        className="md:hidden p-2 w-10 h-10 flex items-center justify-center text-app-black dark:text-zinc-100 cursor-pointer shrink-0"
        title="Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <SearchBar />

      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 relative shrink-0">
        {/* Recherche mobile */}
        <button
          onClick={() => setActiveTab('Explore')}
          className={`${iconButton} md:hidden`}
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Create — icône + texte, sans contour */}
        <button
          onClick={() => setActiveTab('Create')}
          className="h-10 flex items-center gap-2 px-1 text-app-black dark:text-zinc-100 font-bold text-sm hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors cursor-pointer shrink-0"
          title="Create a post"
        >
          <SquarePlus className="w-5 h-5" />
          <span className="hidden md:inline">Create</span>
        </button>

        {/* Messages — icône seule, sans contour */}
        <button onClick={openChat} className={iconButton} title="Messages">
          <MessageCircle className="w-5 h-5" />
          {(unreadMessages ?? 0) > 0 && <span className={badge}>{String(unreadMessages ?? 0)}</span>}
        </button>

        {/* Notifications — icône seule, ouvre sa page */}
        <button onClick={() => setActiveTab('Notifications')} className={iconButton} title="Notifications">
          <Bell className="w-5 h-5" />
          {notificationsCount > 0 && <span className={badge}>{String(notificationsCount)}</span>}
        </button>

        {/* Profil — avatar avec point en ligne, sans contour */}
        <div ref={profileRef} className="hidden md:block relative shrink-0">
          <button
            onClick={() => setShowProfile(!showProfile)}
            title="Profile menu"
            className="relative cursor-pointer"
          >
            <ProfileAvatar size="xs" src={currentUser.avatar} alt={currentUser.name} glow="none" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950" />
          </button>
          <AnimatePresence>{showProfile && <UserProfileDropdown onClose={() => setShowProfile(false)} />}</AnimatePresence>
        </div>
      </div>
    </header>
  );
};
