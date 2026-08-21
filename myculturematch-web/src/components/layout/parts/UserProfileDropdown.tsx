import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, ChevronRight, Moon, Sun, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';

interface UserProfileDropdownProps {
  onClose?: () => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ onClose }) => {
  const { currentUser, theme, toggleTheme, logout } = useAppStore();
  const { setActiveTab } = useUIStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleProfileClick = () => {
    setActiveTab('Totem');
    if (onClose) onClose();
  };

  const handleSettingsClick = () => {
    setActiveTab('Settings');
    if (onClose) onClose();
  };

  const handleThemeClick = () => {
    toggleTheme();
    if (onClose) onClose();
  };

  const handleCancelConfirm = () => {
    setShowLogoutConfirm(false);
    if (onClose) onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#161b22] border border-app-border dark:border-zinc-800 rounded-[24px] shadow-xl overflow-hidden z-50 p-4"
    >
      <AnimatePresence mode="wait">
        {!showLogoutConfirm ? (
          <motion.div
            key="menu-main"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3.5"
          >
            {/* User Details */}
            <div className="flex items-center gap-3 border-b border-app-border dark:border-zinc-800 pb-3.5 select-none">
              <TotemAvatar
                src={currentUser.avatar}
                alt={currentUser.name}
                size="md"
                shape="cloud"
                glow="none"
              />
              <div className="min-w-0">
                <h4 className="font-black text-sm text-app-black dark:text-zinc-100 truncate leading-snug">
                  {currentUser.name}
                </h4>
                <p className="text-[10px] text-app-gray dark:text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                  {currentUser.location}
                </p>
              </div>
            </div>

            {/* Menu Links */}
            <div className="flex flex-col gap-1">
              <button
                onClick={handleProfileClick}
                className="w-full text-left p-3 rounded-2xl flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-app-gray dark:text-zinc-300 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-app-black dark:text-zinc-400">
                    My Totem Profile
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-app-gray group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={handleThemeClick}
                className="w-full text-left p-3 rounded-2xl flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 dark:bg-zinc-800 dark:text-violet-400 flex items-center justify-center">
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-bold text-app-black dark:text-zinc-400">
                    Switch Theme ({theme === 'light' ? 'Dark' : 'Light'})
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-app-gray" />
              </button>

              <button
                onClick={handleSettingsClick}
                className="w-full text-left p-3 rounded-2xl flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E27D60]/10 text-[#E27D60] dark:bg-zinc-800 dark:text-[#E27D60] flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-app-black dark:text-zinc-400">
                    Account Settings
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-app-gray" />
              </button>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full text-left p-3 rounded-2xl flex items-center justify-between hover:bg-[#E27D60]/10 dark:hover:bg-[#E27D60]/20 transition-colors cursor-pointer group text-[#E27D60]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E27D60]/15 dark:bg-zinc-800 text-[#E27D60] dark:text-[#E27D60] flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">
                    Disconnect
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#E27D60]/70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="confirm-logout"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-center py-4"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-100">
              Confirm Disconnection?
            </h4>
            <p className="text-[11px] text-app-gray dark:text-zinc-400 mt-1.5 px-3">
              Are you sure you want to sign out of your ceremonial workspace?
            </p>
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={handleCancelConfirm}
                className="flex-1 py-2 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  logout();
                  if (onClose) onClose();
                }}
                className="flex-1 py-2 text-xs font-bold bg-[#E27D60] hover:bg-[#c66b50] text-white rounded-xl cursor-pointer"
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
