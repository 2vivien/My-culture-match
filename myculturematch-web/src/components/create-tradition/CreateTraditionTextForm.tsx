import React from 'react';
import { 
  Bold, Italic, Strikethrough, Superscript, Link2, Image as ImageIcon, PlaySquare, 
  List, ListOrdered, Quote, Code, MoreHorizontal 
} from 'lucide-react';

interface CreateTraditionTextFormProps {
  title: string;
  setTitle: (title: string) => void;
  body: string;
  setBody: (body: string) => void;
  formats: Record<string, boolean>;
  toggleFormat: (format: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export const CreateTraditionTextForm: React.FC<CreateTraditionTextFormProps> = ({
  title,
  setTitle,
  body,
  setBody,
  formats,
  toggleFormat,
  isSubmitting,
  onSubmit,
}) => {
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

      {/* Tags Button */}
      <div className="mt-2">
        <button type="button" className="px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-app-gray dark:text-zinc-400 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors cursor-pointer w-fit">
          Add tags
        </button>
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
              ? 'bg-app-black hover:bg-zinc-800 text-white dark:bg-white dark:text-app-black dark:hover:bg-zinc-200' 
              : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Tradition'}
        </button>
      </div>
    </div>
  );
};
