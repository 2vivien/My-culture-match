import { useRef, useState, type ChangeEvent } from 'react';
import { Image as ImageIcon, ChevronRight } from 'lucide-react';
import { useStories } from '@/src/hooks/useStories';
import { uploadService } from '@/src/services/uploadService';
import { mediaUrl } from '@/src/lib/media';
import { StoryAvatar } from './StoryAvatar';
import { StoryPlaceDialog, type StoryPlace } from './StoryPlaceDialog';
import { ApiError } from '@/src/services/api';

export const StoriesPanel = () => {
  const { stories, addStory, isAdding } = useStories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  /** URL du média téléversé, en attente du choix d'un lieu (facultatif). */
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [placeError, setPlaceError] = useState<string | null>(null);

  const handleAddNewStory = () => {
    if (isAdding || uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadService.uploadFile(file, 'story');
      if (uploaded?.objectKey) {
        const url = mediaUrl(uploaded.objectKey);
        setPlaceError(null);
        setPendingUrl(url);
      }
    } catch {
      // Upload échoué : ignoré silencieusement
    } finally {
      setUploading(false);
    }
  };

  const publish = (place: StoryPlace | null) => {
    if (!pendingUrl) return;
    setPlaceError(null);
    addStory(
      { img: pendingUrl, place },
      {
        onSuccess: () => setPendingUrl(null),
        onError: (err) => {
          const code = err instanceof ApiError ? err.code : '';
          if (code === 'STORY_PLACE_SHARING_OFF') setPlaceError('Active d’abord le partage de position (carte Friends) pour publier sur la carte.');
          else if (code === 'STORY_PLACE_VISIBILITY_NOBODY') setPlaceError('Ta visibilité est réglée sur « personne » : personne ne verrait ta story sur la carte.');
          else setPlaceError('Publication impossible. Réessaie.');
        },
      },
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-5 shadow-soft border border-app-border select-none">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg flex items-center gap-2 text-app-black dark:text-zinc-100">
          <ImageIcon className="w-5 h-5 text-app-black dark:text-zinc-100" /> Stories
        </h2>
        <button className="text-sm font-semibold text-app-gray hover:text-app-black dark:hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer">
          See all <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-1">
        {stories.map((story) => (
          <StoryAvatar key={story.id} story={story} onAddClick={handleAddNewStory} />
        ))}
      </div>

      {pendingUrl && <StoryPlaceDialog onConfirm={publish} onCancel={() => setPendingUrl(null)} busy={isAdding} error={placeError} />}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
