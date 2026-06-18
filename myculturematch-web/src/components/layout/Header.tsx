import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, ChevronDown, MessageSquare, Plus } from 'lucide-react';
import { SearchBar } from './parts/SearchBar';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { NotificationDropdown } from './parts/NotificationDropdown';
import { UserProfileDropdown } from './parts/UserProfileDropdown';
import { CreateTraditionDialog } from './parts/CreateTraditionDialog';
import { AnimatePresence } from 'framer-motion';

export const Header = () => {
  const { toggleSidebar, notificationsCount, setActiveTab } = useUIStore();
  const { currentUser } = useAppStore();
  
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  
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

  return (
    <header className="h-20 md:h-24 px-4 sm:px-6 md:px-10 flex items-center justify-between gap-4 shrink-0 bg-[#FEFEFE]/85 dark:bg-[#0E0E10]/80 backdrop-blur-md sticky top-0 z-40 w-full border-b border-app-border/40 dark:border-zinc-800/40">
      <button onClick={toggleSidebar} className="md:hidden p-2 bg-white dark:bg-zinc-90 w-10 h-10 rounded-full border border-app-border text-app-gray cursor-pointer flex items-center justify-center shrink-0">
        <Menu className="w-5 h-5" />
      </button>

      <SearchBar />

      <div className="flex items-center gap-1.5 sm:gap-3 md:gap-5 select-none relative shrink-0">
        {/* Create Tradition Action Button */}
        <button
          onClick={() => setShowCreate(true)}
          className="h-10 w-10 md:h-12 md:w-auto md:px-6 rounded-full bg-app-black text-white dark:bg-white dark:text-app-black font-extrabold text-xs shadow-sm hover:opacity-90 hover:scale-[1.02] tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer uppercase shrink-0"
          title="Create a tradition"
        >
          <Plus className="w-5 h-5 stroke-[3] md:w-4 md:h-4" />
          <span className="hidden md:inline">Create</span>
        </button>

        {/* Message Bubble Switcher Shortcut */}
        <button 
          onClick={() => setActiveTab('Thunderbird')} 
          className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-gray hover:text-app-black hover:shadow-md transition-all relative cursor-pointer shrink-0"
          title="Messages"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5 md:w-5 md:h-5 dark:text-zinc-350">
            <path d="M9.948 4.444h-.005c-1.92.788-2.126 2.55-1.817 3.499v.02C9.236 7.18 10.658 6.76 12 6.76c3.26 0 5.902 2.156 5.902 4.815 0 2.66-2.643 4.816-5.902 4.816l-.083-.002c-.155-.006-.354-.013-.435.118-.096.156.116.397.238.536 1.274 1.441 3.123 1.622 3.608 1.67l.076.008c-4.281.414-9.304-2.32-9.306-7.076 0-1.12.414-2.073 1.075-2.83l-.005-.002h-.003C7.31 6.38 6.376 3.47 4.629 2.898c-.124-.04-.246.054-.262.183-.23 1.924-.727 2.59-1.264 3.31-.805 1.08-1.39 2.328-1.365 3.698a10.99 10.99 0 0 1-.705-1.91c-.024-.09-.17-.365-.333-.272-.13.072-.227.274-.296.485A12.137 12.137 0 0 0 0 11.489c0 6.536 5.475 12 12 12 6.627 0 12-5.372 12-12 0-2.526-.781-4.87-2.115-6.805l.167-.002c.518 0 1.024.045 1.51.129-.734-.816-1.724-1.475-2.877-1.904a8.54 8.54 0 0 1 2.494-.495c-1.426-1.166-3.508-1.9-5.827-1.9-3.355 0-6.648 1.29-7.404 3.93zm.682 9.166c-.87-.905-3.473-3.91-3.473-3.91l.202.01 4.075 3.042c.305.223.74.22 1.043-.004l3.996-3.034.212-.018s-2.518 2.935-3.483 3.9c-.964.968-1.703.919-2.572.014zm2.774-10.083s.055.625-.576.824c-.722.227-1.042-.38-1.042-.38s.09-.417.676-.61c.626-.206.942.166.942.166z" />
          </svg>
          <span className="absolute top-2.5 right-2.5 md:top-3 md:right-3 w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full animate-pulse" />
        </button>

        {/* Notification Icon and Trigger */}
        <div ref={notifRef} className="relative shrink-0">
          <button onClick={() => setShowNotif(!showNotif)} className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-app-border dark:border-zinc-800 flex items-center justify-center text-app-gray hover:text-app-black hover:shadow-md transition-all relative cursor-pointer">
            <Bell className="w-4.5 h-4.5 md:w-5 md:h-5 dark:text-zinc-350" />
            {notificationsCount > 0 && (
              <span className="absolute top-2.5 right-2.5 md:top-3 md:right-3 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          <AnimatePresence>{showNotif && <NotificationDropdown />}</AnimatePresence>
        </div>

        {/* User Profile Avatar and Trigger */}
        <div ref={profileRef} className="relative shrink-0">
          <div onClick={() => setShowProfile(!showProfile)} className="bg-white dark:bg-zinc-900 p-0.5 md:pl-2.5 md:pr-4 md:py-1.5 rounded-full shadow-sm border border-app-border dark:border-zinc-800 flex items-center gap-2 cursor-pointer hover:shadow-md transition-all">
            <TotemAvatar size="xs" src={currentUser.avatar} alt={currentUser.name} glow={currentUser.glow} />
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-xs font-black text-app-black dark:text-zinc-200">{currentUser.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-app-gray transition-transform duration-250 group-hover:translate-y-0.5" />
            </div>
          </div>
          <AnimatePresence>{showProfile && <UserProfileDropdown />}</AnimatePresence>
        </div>
      </div>

      {/* Slide-in/Fade Modal for creating a tradition */}
      <AnimatePresence>
        {showCreate && (
          <CreateTraditionDialog onClose={() => setShowCreate(false)} />
        )}
      </AnimatePresence>
    </header>
  );
};
