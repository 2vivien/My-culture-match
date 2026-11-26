import { useState, useRef, useEffect } from 'react';
import { Menu, Search } from 'lucide-react';
import { IconBellFilled, IconBrandSignalFilled, IconLibraryPlusFilled } from '@tabler/icons-react';
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

      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 relative shrink-0">
        {/* Recherche mobile */}
        <button
          onClick={() => setActiveTab('Explore')}
          className={`${iconButton} md:hidden`}
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Create — icône Tabler library-plus remplie + texte, sans contour */}
        <button
          onClick={() => setActiveTab('Create')}
          className="h-10 flex items-center gap-2 px-3 rounded-md bg-zinc-100 dark:bg-zinc-800 text-app-black dark:text-zinc-100 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
          title="Create a post"
        >
          <IconLibraryPlusFilled className="w-5 h-5" />
          <span className="hidden md:inline">Create</span>
        </button>

        {/* Messages — icône Tabler brand-signal remplie, seule */}
        <button onClick={openChat} className={iconButton} title="Messages">
          <IconBrandSignalFilled className="w-5 h-5" />
          {(unreadMessages ?? 0) > 0 && <span className={badge}>{String(unreadMessages ?? 0)}</span>}
        </button>

        {/* Notifications — icône Tabler bell remplie, ouvre sa page */}
        <button onClick={() => setActiveTab('Notifications')} className={iconButton} title="Notifications">
          <IconBellFilled className="w-5 h-5" />
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
