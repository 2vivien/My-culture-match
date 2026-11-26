import React from 'react';
import { motion } from 'framer-motion';

interface ProfileTabItem {
  id: string;
  label: string;
  icon?: unknown;
}

type ProfileTabId = 'Posts' | 'Comments' | 'Saved';

interface ProfileTabsProps {
  tabs: Array<ProfileTabItem & { id: ProfileTabId }>;
  activeTab: ProfileTabId;
  setActiveTab: (tabId: ProfileTabId) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="flex items-stretch gap-6 border-b border-zinc-200 dark:border-zinc-800 w-full mb-4 select-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative pb-3 text-sm font-bold cursor-pointer transition-colors ${
              isActive
                ? 'text-app-black dark:text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="profile-tab-underline"
                className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-zinc-900 dark:bg-zinc-100"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
