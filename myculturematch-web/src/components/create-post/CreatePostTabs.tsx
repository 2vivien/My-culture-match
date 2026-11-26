import React from 'react';
import { Type, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

interface CreatePostTabsProps {
  activeTab: 'Text' | 'Images' | 'Link';
  setActiveTab: (tab: 'Text' | 'Images' | 'Link') => void;
}

export const CreatePostTabs: React.FC<CreatePostTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-6 border-b border-app-border dark:border-zinc-800 mb-6">
      <button
        type="button"
        onClick={() => setActiveTab('Text')}
        className={`flex items-center gap-2 pb-3 border-b-2 font-black transition-colors cursor-pointer ${
          activeTab === 'Text'
            ? 'border-[#3b5998] text-app-black dark:text-white'
            : 'border-transparent text-app-gray hover:text-app-black dark:hover:text-zinc-300'
        }`}
      >
        <Type className="w-4 h-4" />
        Text
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('Images')}
        className={`flex items-center gap-2 pb-3 border-b-2 font-black transition-colors cursor-pointer ${
          activeTab === 'Images'
            ? 'border-[#3b5998] text-app-black dark:text-white'
            : 'border-transparent text-app-gray hover:text-app-black dark:hover:text-zinc-300'
        }`}
      >
        <ImageIcon className="w-4 h-4" />
        Images & Video
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('Link')}
        className={`flex items-center gap-2 pb-3 border-b-2 font-black transition-colors cursor-pointer ${
          activeTab === 'Link'
            ? 'border-[#3b5998] text-app-black dark:text-white'
            : 'border-transparent text-app-gray hover:text-app-black dark:hover:text-zinc-300'
        }`}
      >
        <LinkIcon className="w-4 h-4" />
        Link
      </button>
    </div>
  );
};
