import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/src/lib/utils';
import { SettingsTab } from '@/src/hooks/useSettings';

interface SettingsTabsProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

const TABS: SettingsTab[] = ['Account', 'Profile', 'Privacy', 'Preferences', 'Notifications', 'Email'];

export const SettingsTabs: React.FC<SettingsTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex flex-wrap gap-1 md:gap-2 border-b border-app-border dark:border-zinc-800 pb-3 mb-6">
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2.5 text-sm font-black rounded-full cursor-pointer tracking-wide transition-all relative",
              isActive 
                ? "text-[#E27D60] dark:text-[#E27D60]" 
                : "text-app-gray hover:text-app-black dark:hover:text-zinc-200"
            )}
          >
            {tab}
            {isActive && (
              <motion.div
                layoutId="settings-tab-bar"
                className="absolute bottom-[-13px] left-0 right-0 h-[3px] bg-[#E27D60] rounded-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
