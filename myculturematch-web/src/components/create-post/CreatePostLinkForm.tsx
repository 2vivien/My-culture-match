import React from 'react';

interface CreatePostLinkFormProps {
  linkUrl: string;
  setLinkUrl: (url: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export const CreatePostLinkForm: React.FC<CreatePostLinkFormProps> = ({
  linkUrl,
  setLinkUrl,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <div className="animate-fade-in">
      <textarea 
        value={linkUrl}
        onChange={(e) => setLinkUrl(e.target.value)}
        placeholder="Url"
        className="w-full min-h-[100px] p-4 rounded-2xl border border-app-border dark:border-zinc-800 bg-transparent text-app-black dark:text-white font-semibold text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors resize-y"
      />
      <div className="flex justify-end items-center mt-4">
        <button 
          type="button"
          onClick={onSubmit}
          disabled={!linkUrl.trim() || isSubmitting}
          className={`px-8 py-2 rounded-full font-black text-sm tracking-wider transition-all cursor-pointer ${
            linkUrl.trim() && !isSubmitting
              ? 'bg-[#8B4A2B] hover:bg-[#6F3A22] text-white' 
              : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Post'}
        </button>
      </div>
    </div>
  );
};
