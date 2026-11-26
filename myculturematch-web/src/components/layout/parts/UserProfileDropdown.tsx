import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SquarePen,
  Trophy,
  FileText,
  CircleDollarSign,
  Moon,
  Sun,
  LogOut,
  Settings,
  Bell,
} from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';

interface UserProfileDropdownProps {
  onClose?: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ onClose }) => {
  const { currentUser, theme, toggleTheme, logout } = useAppStore();
  const { setActiveTab } = useUIStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const go = (tab: string) => {
    setActiveTab(tab);
    onClose?.();
  };

  const row =
    'w-full px-3 py-2 flex items-center gap-3 text-left cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors';
  const icon = 'w-5 h-5 text-zinc-700 dark:text-zinc-300 shrink-0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute right-0 mt-2 w-72 max-h-[70vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 py-2"
    >
      <AnimatePresence mode="wait">
        {!showLogoutConfirm ? (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button onClick={() => go('Profil')} className={`${row} px-4 py-3`}>
              <div className="relative shrink-0">
                <ProfileAvatar
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  size="sm"
                  glow="none"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-app-black dark:text-zinc-100 truncate">View Profile</p>
                <p className="text-[11px] text-zinc-500 truncate">{currentUser.username || currentUser.name}</p>
              </div>
            </button>

            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />

            <button onClick={() => go('Profil')} className={row}>
              <SquarePen className={icon} />
              <span className="text-sm font-bold text-app-black dark:text-zinc-100">Edit Profile</span>
            </button>
            <button onClick={() => go('Profil')} className={row}>
              <Trophy className={icon} />
              <span className="flex flex-col items-start">
                <span className="text-sm font-bold text-app-black dark:text-zinc-100">Achievements</span>
                <span className="text-[11px] text-zinc-500">{currentUser.level} unlocked</span>
              </span>
            </button>
            <button onClick={() => go('Create')} className={row}>
              <FileText className={icon} />
              <span className="text-sm font-bold text-app-black dark:text-zinc-100">Drafts</span>
            </button>
            <button onClick={() => go('Create')} className={row}>
              <CircleDollarSign className={icon} />
              <span className="flex flex-col items-start">
                <span className="text-sm font-bold text-app-black dark:text-zinc-100">Earn</span>
                <span className="text-[11px] text-zinc-500">Share your culture</span>
              </span>
            </button>

            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />

            <button onClick={() => { toggleTheme(); onClose?.(); }} className={row}>
              {theme === 'light' ? <Moon className={icon} /> : <Sun className={icon} />}
              <span className="text-sm font-bold text-app-black dark:text-zinc-100">Display Mode</span>
            </button>
            <button onClick={() => go('Notifications')} className={row}>
              <Bell className={icon} />
              <span className="text-sm font-bold text-app-black dark:text-zinc-100">Notifications</span>
            </button>
            <button onClick={() => setShowLogoutConfirm(true)} className={row}>
              <LogOut className={icon} />
              <span className="text-sm font-bold text-app-black dark:text-zinc-100">Log Out</span>
            </button>

            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />

            <button onClick={() => go('Settings')} className={row}>
              <Settings className={icon} />
              <span className="text-sm font-bold text-app-black dark:text-zinc-100">Settings</span>
            </button>
          </motion.div>
        ) : (
          <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-5 text-center">
            <p className="text-sm font-bold text-app-black dark:text-zinc-100 mb-1">Log out of MyCultureMatch?</p>
            <p className="text-xs text-zinc-500 mb-4">You can log back in anytime.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowLogoutConfirm(false); onClose?.(); }}
                className="flex-1 py-2 text-xs font-bold rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => { logout(); onClose?.(); }}
                className="flex-1 py-2 text-xs font-bold rounded-md bg-zinc-900 hover:bg-zinc-700 text-white cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
