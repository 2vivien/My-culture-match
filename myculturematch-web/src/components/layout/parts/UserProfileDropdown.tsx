import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, ChevronRight, Moon, Sun, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';

export const UserProfileDropdown: React.FC = () => {
  const { currentUser, theme, toggleTheme } = useAppStore();
  const { setActiveTab } = useUIStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleProfileClick = () => {
    setActiveTab('Totem');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-850 rounded-[24px] shadow-xl overflow-hidden z-50 p-4"
    >
      <AnimatePresence mode="wait">
        {!showLogoutConfirm ? (
          <motion.div
            key="menu-main"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
          >
            {/* User Meta Card Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-app-border dark:border-zinc-850">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 select-none">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-100 truncate">
                  {currentUser.name}
                </h4>
                <p className="text-[10px] text-zinc-500 font-bold tracking-tight">
                  Level {currentUser.level} • {currentUser.location}
                </p>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Elite
              </span>
            </div>

            {/* Menu Links */}
            <div className="mt-3 space-y-1">
              <button
                onClick={handleProfileClick}
                className="w-full text-left p-3 rounded-2xl flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 dark:bg-zinc-800 dark:text-orange-400 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-app-black dark:text-zinc-250">
                    My Totem Profile
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-app-gray group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={toggleTheme}
                className="w-full text-left p-3 rounded-2xl flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 dark:bg-zinc-800 dark:text-violet-400 flex items-center justify-center">
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-bold text-app-black dark:text-zinc-250">
                    Switch Theme ({theme === 'light' ? 'Dark' : 'Light'})
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-app-gray" />
              </button>

              <button
                className="w-full text-left p-3 rounded-2xl flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-zinc-800 dark:text-blue-400 flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-app-black dark:text-zinc-250">
                    Account Settings
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-app-gray" />
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left p-3 rounded-2xl flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer group text-red-600"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-zinc-800 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold">
                    Disconnect
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
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
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer"
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
