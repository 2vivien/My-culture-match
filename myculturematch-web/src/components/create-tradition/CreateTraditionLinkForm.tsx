import React from 'react';

interface CreateTraditionLinkFormProps {
  linkUrl: string;
  setLinkUrl: (url: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export const CreateTraditionLinkForm: React.FC<CreateTraditionLinkFormProps> = ({
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
              ? 'bg-[#E27D60] hover:bg-[#c66b50] text-white' 
              : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Tradition'}
        </button>
      </div>
    </div>
  );
};
