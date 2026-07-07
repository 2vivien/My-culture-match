import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, ChevronDown, Plus, SquarePen, Search } from 'lucide-react';
import { SandboxIcon } from '@/src/components/ui/SandboxIcon';
import { SearchBar } from './parts/SearchBar';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { NotificationDropdown } from './parts/NotificationDropdown';
import { UserProfileDropdown } from './parts/UserProfileDropdown';

import { AnimatePresence } from 'framer-motion';

export const Header = () => {
  const { toggleSidebar, notificationsCount, setActiveTab } = useUIStore();
  const { currentUser } = useAppStore();
  
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const formatCount = (count: number) => {
    return count < 10 ? `0${count}` : count.toString();
  };

  return (
    <header className="h-20 md:h-24 px-4 sm:px-6 md:px-10 flex items-center justify-between gap-4 shrink-0 bg-[#FEFEFE]/85 dark:bg-[#0E0E10]/80 backdrop-blur-md sticky top-0 z-40 w-full border-b border-app-border/40 dark:border-zinc-800/40">
      <button onClick={toggleSidebar} className="md:hidden p-2 bg-white dark:bg-zinc-900 w-10 h-10 rounded-full border border-app-border dark:border-zinc-800 text-app-gray dark:text-zinc-300 cursor-pointer flex items-center justify-center shrink-0">
        <Menu className="w-5 h-5" />
      </button>

      <SearchBar />

      <div className="flex items-center gap-1.5 sm:gap-3 md:gap-5 select-none relative shrink-0">
        {/* Mobile search icon button - placed side-by-side with others */}
        <button
          onClick={() => setActiveTab('Explore')}
          className="md:hidden w-10 h-10 bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-gray hover:text-app-black cursor-pointer select-none shrink-0"
          title="Search"
        >
          <Search className="w-4.5 h-4.5 text-app-black dark:text-zinc-350" />
        </button>

        {/* Create Tradition Action Button */}
        <button
          onClick={() => setActiveTab('Create')}
          className="h-10 w-10 md:h-12 md:w-auto md:px-6 rounded-full bg-app-black text-white dark:bg-white dark:text-app-black font-extrabold text-xs shadow-sm hover:opacity-90 hover:scale-[1.02] tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer uppercase shrink-0"
          title="Create a tradition"
        >
          <SquarePen className="w-5 h-5 md:w-4 md:h-4" />
          <span className="hidden md:inline">Create</span>
        </button>

        {/* Message Bubble Switcher Shortcut */}
        <button 
          onClick={() => setActiveTab('Sandbox')} 
          className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-gray hover:text-app-black hover:shadow-md transition-all relative cursor-pointer shrink-0"
          title="Messages"
        >
          <SandboxIcon className="w-4.5 h-4.5 md:w-5 md:h-5 text-app-black dark:text-zinc-350" />
          <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center bg-[#E27D60] text-[9px] font-black text-white shadow-sm animate-pulse">
            99+
          </span>
        </button>

        {/* Notification Icon and Trigger */}
        <div ref={notifRef} className="relative shrink-0">
          <button onClick={() => setShowNotif(!showNotif)} className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-gray hover:text-app-black hover:shadow-md transition-all relative cursor-pointer">
            <Bell className="w-4.5 h-4.5 md:w-5 md:h-5 text-app-black dark:text-zinc-350" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center bg-[#E27D60] text-[9px] font-black text-white shadow-sm animate-pulse">
                {formatCount(notificationsCount)}
              </span>
            )}
          </button>
          <AnimatePresence>{showNotif && <NotificationDropdown />}</AnimatePresence>
        </div>

        {/* User Profile Avatar and Trigger (Desktop only) */}
        <div ref={profileRef} className="hidden md:block relative shrink-0">
          <div onClick={() => setShowProfile(!showProfile)} className="bg-white dark:bg-zinc-900 p-0.5 md:pl-2.5 md:pr-4 md:py-1.5 rounded-full shadow-sm border border-app-border dark:border-zinc-800 flex items-center gap-2 cursor-pointer hover:shadow-md transition-all">
            <TotemAvatar size="xs" src={currentUser.avatar} alt={currentUser.name} glow={currentUser.glow} />
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-xs font-black text-app-black dark:text-zinc-200">{currentUser.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-app-gray transition-transform duration-250 group-hover:translate-y-0.5" />
            </div>
          </div>
          <AnimatePresence>{showProfile && <UserProfileDropdown onClose={() => setShowProfile(false)} />}</AnimatePresence>
        </div>
      </div>


    </header>
  );
};
