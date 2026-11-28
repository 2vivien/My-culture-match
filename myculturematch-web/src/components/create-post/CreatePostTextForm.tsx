import React, { useState } from 'react';
import { 
  Bold, Italic, Strikethrough, Superscript, Link2, Image as ImageIcon, PlaySquare, 
  List, ListOrdered, Quote, Code, MoreHorizontal 
} from 'lucide-react';
import { launchThemes, themeIcons } from '@/src/lib/themes';

interface CreatePostTextFormProps {
  title: string;
  setTitle: (title: string) => void;
  body: string;
  setBody: (body: string) => void;
  formats: Record<string, boolean>;
  toggleFormat: (format: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
}

export const CreatePostTextForm: React.FC<CreatePostTextFormProps> = ({
  title,
  setTitle,
  body,
  setBody,
  formats,
  toggleFormat,
  isSubmitting,
  onSubmit,
  selectedTags,
  onToggleTag,
}) => {
  const [showTags, setShowTags] = useState(false);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Title Input */}
      <div className="relative">
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 300))}
          placeholder="Title" 
          className="w-full px-4 py-3 rounded-2xl border border-app-border dark:border-zinc-800 bg-transparent text-app-black dark:text-white font-semibold text-base focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
        />
        {!title && <span className="absolute left-12 top-1/2 -translate-y-1/2 text-red-500 font-bold">*</span>}
        <div className="absolute right-3 -bottom-5 text-[10px] font-bold text-app-gray">
          {title.length}/300
        </div>
      </div>

      {/* Custom Tags input for Post/Post */}
      <div className="mt-2 flex flex-col gap-2 select-none">
        <label className="text-[10px] font-black uppercase tracking-wider text-app-gray dark:text-zinc-500">
          Add custom tags (optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="post-tag-input"
            placeholder="Type a tag (e.g. #Fon, #Kintsugi, #Ceremony) and click Add"
            className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-2xl border border-app-border dark:border-zinc-800 bg-transparent text-app-black dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors placeholder:text-app-gray/60"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const btn = document.getElementById('add-tag-btn');
                if (btn) btn.click();
              }
            }}
          />
          <button
            type="button"
            id="add-tag-btn"
            onClick={() => {
              const input = document.getElementById('post-tag-input') as HTMLInputElement;
              if (input && input.value.trim()) {
                let tag = input.value.trim();
                if (!tag.startsWith('#')) tag = '#' + tag;
                if (selectedTags.includes(tag)) {
                  input.value = '';
                  return;
                }
                if (selectedTags.length >= 4) {
                  alert('Maximum 4 tags allowed.');
                  return;
                }
                onToggleTag(tag);
                input.value = '';
              }
            }}
            className="px-4 py-2.5 rounded-2xl bg-[#E27D60] hover:bg-[#c66b50] text-white font-extrabold text-xs cursor-pointer transition-all flex items-center justify-center border-none"
          >
            Add
          </button>
        </div>

        {/* Display currently selected tags */}
        <div className="flex flex-wrap gap-2 mt-1">
          {selectedTags.map(tag => (
            <span key={tag} className="px-3 py-1 rounded-full bg-[#E27D60]/10 text-[#E27D60] text-xs font-bold flex items-center gap-1 select-none border border-[#E27D60]/10">
              <span>{tag}</span>
              <button 
                type="button" 
                onClick={() => onToggleTag(tag)}
                className="hover:text-red-500 font-extrabold text-[10px] ml-1 cursor-pointer bg-transparent border-none p-0 flex items-center justify-center leading-none"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="border border-app-border dark:border-zinc-800 rounded-2xl overflow-hidden mt-2 bg-transparent focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-app-border dark:border-zinc-800">
          <button type="button" onClick={() => toggleFormat('bold')} className={`p-1.5 rounded transition-colors ${formats.bold ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><Bold className="w-4 h-4" /></button>
          <button type="button" onClick={() => toggleFormat('italic')} className={`p-1.5 rounded transition-colors ${formats.italic ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><Italic className="w-4 h-4" /></button>
          <button type="button" onClick={() => toggleFormat('strikethrough')} className={`p-1.5 rounded transition-colors ${formats.strikethrough ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><Strikethrough className="w-4 h-4" /></button>
          <button type="button" onClick={() => toggleFormat('superscript')} className={`p-1.5 rounded transition-colors ${formats.superscript ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><Superscript className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-app-border dark:bg-zinc-700 mx-1" />
          <button type="button" className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300 transition-colors"><Link2 className="w-4 h-4" /></button>
          <button type="button" className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300 transition-colors"><ImageIcon className="w-4 h-4" /></button>
          <button type="button" className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300 transition-colors"><PlaySquare className="w-4 h-4" /></button>
          <button type="button" onClick={() => toggleFormat('list')} className={`p-1.5 rounded transition-colors ${formats.list ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><List className="w-4 h-4" /></button>
          <button type="button" onClick={() => toggleFormat('orderedList')} className={`p-1.5 rounded transition-colors ${formats.orderedList ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><ListOrdered className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-app-border dark:bg-zinc-700 mx-1" />
          <button type="button" onClick={() => toggleFormat('quote')} className={`p-1.5 rounded transition-colors ${formats.quote ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><Quote className="w-4 h-4" /></button>
          <button type="button" onClick={() => toggleFormat('code')} className={`p-1.5 rounded transition-colors ${formats.code ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><Code className="w-4 h-4" /></button>
          <div className="ml-auto">
            <button type="button" className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
        </div>
        
        <textarea 
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Body text (optional)"
          className={`w-full min-h-[200px] p-4 bg-transparent outline-none text-app-black dark:text-zinc-200 text-sm resize-y ${formats.bold ? 'font-bold' : ''} ${formats.italic ? 'italic' : ''} ${formats.strikethrough ? 'line-through' : ''}`}
        />
      </div>
      
      <div className="flex justify-end items-center mt-2">
        <button 
          type="button"
          onClick={onSubmit}
          disabled={!title.trim() || isSubmitting}
          className={`px-8 py-2 rounded-full font-black text-sm tracking-wider transition-all cursor-pointer ${
            title.trim() && !isSubmitting
              ? 'bg-[#E27D60] hover:bg-[#c66b50] text-white' 
              : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Post'}
        </button>
      </div>
    </div>
  );
};
