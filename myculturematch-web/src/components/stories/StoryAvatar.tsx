import React from 'react';
import { Plus } from 'lucide-react';
import { Story } from '@/src/types/story';
import { TotemAvatar } from '../ui/TotemAvatar';
import { userService } from '@/src/services/userService';
import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';

interface StoryAvatarProps {
  story: Story;
  onAddClick?: () => void;
}

export const StoryAvatar: React.FC<StoryAvatarProps> = ({ story, onAddClick }) => {
  const { setActiveTab } = useUIStore();
  const { setSelectedTotemUserId } = useAppStore();

  if (story.isAdd) {
    return (
      <div onClick={onAddClick} className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0 select-none">
        <div className="w-12 h-12 rounded-full border border-dashed border-app-border dark:border-zinc-700 flex items-center justify-center group-hover:border-app-black dark:group-hover:border-zinc-300 transition-colors bg-white dark:bg-zinc-900">
          <Plus className="w-5 h-5 text-app-gray group-hover:text-app-black dark:group-hover:text-white transition-colors" />
        </div>
        <span className="text-[11px] font-bold text-app-gray mt-1">My Story</span>
      </div>
    );
  }

  const user = userService.getUserById(story.id);

  const handleClick = () => {
    setSelectedTotemUserId(story.id);
    setActiveTab('Totem');
  };

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0 select-none">
      <TotemAvatar
        size="md"
        src={story.img}
        alt={story.name}
        glow={user?.glow || 'none'}
        level={user?.level}
        hasStory={true}
        onClick={handleClick}
      />
      <span className="text-[11px] font-bold text-app-black dark:text-zinc-100 mt-1">{story.name}</span>
    </div>
  );
};
