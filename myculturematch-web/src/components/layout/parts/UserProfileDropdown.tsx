import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, ChevronRight, Moon, Sun, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { ProfileIcon } from './SidebarNav';

interface UserProfileDropdownProps {
  onClose?: () => void;
}

/**
 * Popup profil du navbar — neutre (sans les couleurs du sidebar) :
 * icônes grises uniformes, "Disconnect" en rouge, avec un popup de
 * confirmation avant la déconnexion.
 */
export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ onClose }) => {
  const { currentUser, theme, toggleTheme, logout } = useAppStore();
  const { setActiveTab } = useUIStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleProfileClick = () => {
    setActiveTab('Profil');
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

  const menuItem =
    'w-full text-left p-3.5 rounded-2xl flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group';

  const iconTile =
    'w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-app-gray dark:text-zinc-300 flex items-center justify-center shrink-0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute right-0 mt-3 w-[22rem] bg-white dark:bg-[#161b22] border border-app-border dark:border-zinc-800 rounded-[24px] shadow-xl overflow-hidden z-50 p-5"
    >
      <AnimatePresence mode="wait">
        {!showLogoutConfirm ? (
          <motion.div
            key="menu-main"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-4"
          >
            {/* User Details */}
            <div className="flex items-center gap-3.5 border-b border-app-border dark:border-zinc-800 pb-4 select-none">
              <ProfileAvatar
                src={currentUser.avatar}
                alt={currentUser.name}
                countryFlag={currentUser.country}
                size="lg"
                shape="cloud"
                glow="none"
              />
              <div className="min-w-0">
                <h4 className="font-black text-base text-app-black dark:text-zinc-100 truncate leading-snug">
                  {currentUser.name}
                </h4>
                <p className="text-sm text-app-gray dark:text-zinc-400 font-bold tracking-wide mt-0.5">
                  {currentUser.username}
                </p>
              </div>
            </div>

            {/* Menu Links — icônes neutres, sans couleur */}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={handleProfileClick}
                className={menuItem}
              >
                <div className="flex items-center gap-3.5">
                  <div className={iconTile}>
                    <ProfileIcon className="w-6 h-6" />
                  </div>
                  <span className="text-[15px] font-bold text-app-black dark:text-zinc-100">
                    My Profile
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-app-gray group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={handleThemeClick}
                className={menuItem}
              >
                <div className="flex items-center gap-3.5">
                  <div className={iconTile}>
                    {theme === 'light' ? <Moon className="w-5.5 h-5.5" /> : <Sun className="w-5.5 h-5.5" />}
                  </div>
                  <span className="text-[15px] font-bold text-app-black dark:text-zinc-100">
                    Switch Theme ({theme === 'light' ? 'Dark' : 'Light'})
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-app-gray" />
              </button>

              <button
                onClick={handleSettingsClick}
                className={menuItem}
              >
                <div className="flex items-center gap-3.5">
                  <div className={iconTile}>
                    <Settings className="w-5.5 h-5.5" />
                  </div>
                  <span className="text-[15px] font-bold text-app-black dark:text-zinc-100">
                    Account Settings
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-app-gray" />
              </button>

              <button
                onClick={() => setShowLogoutConfirm(true)}
                className={`${menuItem} text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center shrink-0">
                    <LogOut className="w-5.5 h-5.5" />
                  </div>
                  <span className="text-[15px] font-bold">
                    Disconnect
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="confirm-logout"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-center py-5"
          >
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h4 className="font-extrabold text-base text-app-black dark:text-zinc-100">
              Log out of MyCultureMatch?
            </h4>
            <p className="text-sm text-app-gray dark:text-zinc-400 mt-2 px-3">
              You can log back in anytime to see your saved posts and messages.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelConfirm}
                className="flex-1 py-3 text-sm font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  logout();
                  if (onClose) onClose();
                }}
                className="flex-1 py-3 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl cursor-pointer"
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
