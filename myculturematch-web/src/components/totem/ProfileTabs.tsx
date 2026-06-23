import React from 'react';
import { motion } from 'framer-motion';

interface ProfileTabItem {
  id: string;
  icon: any;
  label: string;
}

interface ProfileTabsProps {
  tabs: ProfileTabItem[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  tabs,
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="bg-white dark:bg-[#1c212e] rounded-[20px] shadow-sm px-6 flex items-stretch h-[100px] w-full mb-6 border border-gray-100 dark:border-zinc-800/50">
      <div className="flex h-full items-stretch flex-1 justify-start md:justify-center gap-1 sm:gap-2 overflow-x-auto hide-scrollbar">
        {tabs.map((tab, idx) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <div key={tab.id} className="flex h-full items-stretch shrink-0">
              {idx > 0 && <div className="w-[1px] bg-gray-200 dark:bg-zinc-800 self-center h-10 mx-1 sm:mx-2" />}
              <button
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative h-full px-4 sm:px-6 flex items-center justify-center transition-colors group cursor-pointer ${
                  isActive ? 'text-[#2dd9d9] dark:text-[#2dd9d9] font-black' : 'text-[#9aa3b8] hover:text-[#2e3552] dark:hover:text-white'
                }`}
                title={tab.label}
              >
                <IconComponent className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {isActive && (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[4px] bg-[#2dd9d9] rounded-t-full shadow-[0_-2px_10px_rgba(45,217,217,0.4)]" 
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
