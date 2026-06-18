import { useState } from 'react';
import { Image, Camera, Smile, Send } from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { useFeed } from '@/src/hooks/useFeed';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { Button } from '@/src/components/ui/button';
import { useUIStore } from '@/src/stores/useUIStore';

export const CreatePostBox = () => {
  const { currentUser, setSelectedTotemUserId } = useAppStore();
  const { setActiveTab } = useUIStore();
  const { createPost, isCreating } = useFeed();
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim() || isCreating) return;
    createPost({
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        location: currentUser.location,
      },
      text: text.trim(),
      date: 'Today',
    });
    setText('');
  };

  const handleAvatarClick = () => {
    setSelectedTotemUserId(currentUser.id);
    setActiveTab('Totem');
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-3xl p-5 shadow-soft border border-app-border dark:border-zinc-850 flex flex-col gap-4 select-none">
      <div className="flex items-center gap-4">
        <TotemAvatar size="md" src={currentUser.avatar} alt={currentUser.name} glow={currentUser.glow} level={currentUser.level} onClick={handleAvatarClick} />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Share a tradition..."
          className="flex-1 bg-transparent text-sm sm:text-base md:text-lg placeholder-app-gray text-app-black dark:text-zinc-150 border-none outline-none focus:ring-0"
        />
      </div>

      <div className="flex items-center justify-between border-t border-app-border dark:border-zinc-850 pt-4">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="p-2 hover:bg-[#FCFCFC] dark:hover:bg-zinc-900 rounded-full text-app-gray hover:text-app-black dark:hover:text-zinc-100"><Image className="w-5 h-5" /></Button>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-[#FCFCFC] dark:hover:bg-zinc-900 rounded-full text-app-gray hover:text-app-black dark:hover:text-zinc-100"><Camera className="w-5 h-5" /></Button>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-[#FCFCFC] dark:hover:bg-zinc-900 rounded-full text-app-gray hover:text-app-black dark:hover:text-zinc-100"><Smile className="w-5 h-5" /></Button>
        </div>
        <Button onClick={handleSubmit} disabled={!text.trim() || isCreating} size="icon" className="w-10 h-10 sm:w-12 sm:h-12 bg-app-black dark:bg-white text-white dark:text-app-black hover:scale-105 rounded-xl flex items-center justify-center cursor-pointer">
          <Send className="w-4.5 h-4.5 sm:w-5 sm:h-5 ml-0.5 text-white dark:text-app-black" />
        </Button>
      </div>
    </div>
  );
};
