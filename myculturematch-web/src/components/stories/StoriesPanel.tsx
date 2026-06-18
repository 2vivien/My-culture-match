import { Image as ImageIcon, ChevronRight } from 'lucide-react';
import { useStories } from '@/src/hooks/useStories';
import { StoryAvatar } from './StoryAvatar';

export const StoriesPanel = () => {
  const { stories, addStory } = useStories();

  const handleAddNewStory = () => {
    const randomAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
    ];
    const chosen = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];
    addStory(chosen);
  };

  return (
    <div className="bg-white rounded-[24px] p-5 shadow-soft border border-app-border select-none">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg flex items-center gap-2 text-app-black">
          <ImageIcon className="w-5 h-5 text-app-black" /> Stories
        </h2>
        <button className="text-sm font-semibold text-app-gray hover:text-app-black flex items-center gap-0.5 transition-colors cursor-pointer">
          See all <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-1">
        {stories.map((story) => (
          <StoryAvatar key={story.id} story={story} onAddClick={handleAddNewStory} />
        ))}
      </div>
    </div>
  );
};
