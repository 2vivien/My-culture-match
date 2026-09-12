import React from 'react';

interface CreateTraditionMediaFormProps {
  mediaPreview: string | null;
  onMediaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearMedia: () => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export const CreateTraditionMediaForm: React.FC<CreateTraditionMediaFormProps> = ({
  mediaPreview,
  onMediaChange,
  onClearMedia,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {!mediaPreview ? (
        <div className="h-[300px] border-2 border-dashed border-app-border dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-4 text-app-gray relative overflow-hidden group hover:border-[#E27D60] hover:bg-[#E27D60]/5 transition-all">
          <input 
            type="file" 
            accept="image/*,video/*" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={onMediaChange}
          />
          <p className="text-sm font-bold group-hover:text-app-black dark:group-hover:text-white transition-colors">
            Drag and drop images or video here
          </p>
          <button type="button" className="px-6 py-2 rounded-full border border-app-border dark:border-zinc-700 font-extrabold text-sm group-hover:bg-[#E27D60] group-hover:text-white group-hover:border-[#E27D60] transition-colors relative z-0">
            Select Media
          </button>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-app-border dark:border-zinc-800 bg-black flex items-center justify-center max-h-[400px]">
          <img src={mediaPreview} alt="Preview" className="max-h-[400px] w-auto object-contain" />
          <button 
            type="button"
            onClick={onClearMedia}
            className="absolute top-4 right-4 px-4 py-2 bg-black/60 text-white text-xs font-bold rounded-full hover:bg-black/80 transition-colors backdrop-blur-md cursor-pointer z-20"
          >
            Change Media
          </button>
        </div>
      )}
      
      <div className="flex justify-end items-center mt-2">
        <button 
          type="button"
          onClick={onSubmit}
          disabled={!mediaPreview || isSubmitting}
          className={`px-8 py-2 rounded-full font-black text-sm tracking-wider transition-all cursor-pointer ${
            mediaPreview && !isSubmitting
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
