import { useRef, useState, type ChangeEvent } from 'react';
import { Image, Camera, Smile, Send, X } from 'lucide-react';
import { useAppStore } from '@/src/stores/useAppStore';
import { useFeed } from '@/src/hooks/useFeed';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { Button } from '@/src/components/ui/button';
import { useUIStore } from '@/src/stores/useUIStore';
import { uploadService } from '@/src/services/uploadService';
import { mediaUrl } from '@/src/lib/media';

export const CreatePostBox = () => {
  const { currentUser, setSelectedProfileUserId } = useAppStore();
  const { setActiveTab } = useUIStore();
  const { createPost, isCreating } = useFeed();
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadService.uploadFile(file, 'post');
      if (uploaded?.objectKey) {
        // In mock mode, use the local file URL; in real mode, use the media URL
        const url = uploaded.objectKey.startsWith('mock/') ? URL.createObjectURL(file) : mediaUrl(uploaded.objectKey);
        setImageUrl(url);
      }
    } catch {
      setImageUrl(undefined);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if ((!text.trim() && !imageUrl) || isCreating || isUploading) return;
    createPost({
      author: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        location: currentUser.location,
      },
      text: text.trim(),
      image: imageUrl,
      date: 'Today',
    });
    setText('');
    setImageUrl(undefined);
  };

  const handleAvatarClick = () => {
    setSelectedProfileUserId(currentUser.id);
    setActiveTab('Profil');
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-3xl p-5 shadow-soft border border-app-border dark:border-zinc-800 flex flex-col gap-4 select-none">
      <div className="flex items-center gap-4">
        <ProfileAvatar size="md" src={currentUser.avatar} alt={currentUser.name} glow={currentUser.glow} level={currentUser.level} onClick={handleAvatarClick} />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Share a post..."
          className="flex-1 bg-transparent text-sm sm:text-base md:text-lg placeholder-app-gray text-app-black dark:text-zinc-300 border-none outline-none focus:ring-0"
        />
      </div>

      {imageUrl && (
        <div className="relative w-fit">
          <img src={imageUrl} alt="Post preview" className="h-32 w-auto rounded-2xl border border-app-border dark:border-zinc-800 object-cover" />
          <button
            type="button"
            onClick={() => setImageUrl(undefined)}
            className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors cursor-pointer"
            aria-label="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-app-border dark:border-zinc-800 pt-4">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-[#FCFCFC] dark:hover:bg-zinc-900 rounded-full text-app-gray hover:text-app-black dark:hover:text-zinc-100"><Image className="w-5 h-5" /></Button>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-[#FCFCFC] dark:hover:bg-zinc-900 rounded-full text-app-gray hover:text-app-black dark:hover:text-zinc-100"><Camera className="w-5 h-5" /></Button>
          <Button variant="ghost" size="sm" className="p-2 hover:bg-[#FCFCFC] dark:hover:bg-zinc-900 rounded-full text-app-gray hover:text-app-black dark:hover:text-zinc-100"><Smile className="w-5 h-5" /></Button>
        </div>
        <Button onClick={handleSubmit} disabled={(!text.trim() && !imageUrl) || isCreating || isUploading} size="icon" className="w-10 h-10 sm:w-12 sm:h-12 bg-[#E27D60] hover:bg-[#c66b50] text-white hover:scale-105 rounded-xl flex items-center justify-center cursor-pointer">
          {isUploading ? (
            <div className="w-4.5 h-4.5 border-2 border-white dark:border-app-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4.5 h-4.5 sm:w-5 sm:h-5 ml-0.5 text-white dark:text-app-black" />
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
    </div>
  );
};
