import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronDown, Type, Image as ImageIcon, Link as LinkIcon, BarChart2,
  Bold, Italic, Strikethrough, Superscript, Link2, PlaySquare, List, ListOrdered, Quote, Code, LayoutTemplate, MoreHorizontal
} from 'lucide-react';
import { useUIStore } from '@/src/stores/useUIStore';

export const CreateTraditionView = () => {
  const { setActiveTab } = useUIStore();
  const [activeSubTab, setActiveSubTab] = useState<'Text' | 'Images' | 'Link'>('Text');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  
  // Rich text formatting states
  const [formats, setFormats] = useState<Record<string, boolean>>({
    bold: false,
    italic: false,
    strikethrough: false,
    superscript: false,
    list: false,
    orderedList: false,
    quote: false,
    code: false,
  });

  const toggleFormat = (format: string) => {
    setFormats(prev => ({ ...prev, [format]: !prev[format] }));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    // Mock submission
    setActiveTab('Home');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex-1 max-w-3xl w-full h-full mx-auto pb-12 pt-4 select-none overflow-y-auto hide-scrollbar pr-2"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-app-black dark:text-zinc-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-app-border dark:border-zinc-800 flex items-center justify-center shrink-0">
            <LayoutTemplate className="w-4 h-4 text-app-gray" />
          </div>
          Create Tradition
        </h1>
      </div>

      <div className="bg-white dark:bg-zinc-950 rounded-[20px] p-6 border border-app-border dark:border-zinc-850 shadow-sm">
        {/* Select Tribu Dropdown Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-app-border dark:border-zinc-800 rounded-full text-sm font-extrabold text-app-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors mb-6 cursor-pointer">
          Select Tribu
          <ChevronDown className="w-4 h-4 text-app-gray" />
        </button>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-6 border-b border-app-border dark:border-zinc-850 mb-6">
          <button 
            onClick={() => setActiveSubTab('Text')}
            className={`flex items-center gap-2 pb-3 border-b-2 font-black transition-colors ${
              activeSubTab === 'Text' ? 'border-[#3b5998] text-app-black dark:text-white' : 'border-transparent text-app-gray hover:text-app-black dark:hover:text-zinc-300'
            }`}
          >
            <Type className="w-4 h-4" />
            Text
          </button>
          <button 
            onClick={() => setActiveSubTab('Images')}
            className={`flex items-center gap-2 pb-3 border-b-2 font-black transition-colors ${
              activeSubTab === 'Images' ? 'border-[#3b5998] text-app-black dark:text-white' : 'border-transparent text-app-gray hover:text-app-black dark:hover:text-zinc-300'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Images & Video
          </button>
          <button 
            onClick={() => setActiveSubTab('Link')}
            className={`flex items-center gap-2 pb-3 border-b-2 font-black transition-colors ${
              activeSubTab === 'Link' ? 'border-[#3b5998] text-app-black dark:text-white' : 'border-transparent text-app-gray hover:text-app-black dark:hover:text-zinc-300'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Link
          </button>
        </div>

        {/* Content Area */}
        {activeSubTab === 'Text' && (
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
              <button className="px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-app-gray dark:text-zinc-400 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-850 transition-colors cursor-pointer w-fit">
                Add tags
              </button>
            </div>

            {/* Editor Area */}
            <div className="border border-app-border dark:border-zinc-800 rounded-2xl overflow-hidden mt-2 bg-transparent focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-app-border dark:border-zinc-800">
                <button onClick={() => toggleFormat('bold')} className={`p-1.5 rounded transition-colors ${formats.bold ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><Bold className="w-4 h-4" /></button>
                <button onClick={() => toggleFormat('italic')} className={`p-1.5 rounded transition-colors ${formats.italic ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><Italic className="w-4 h-4" /></button>
                <button onClick={() => toggleFormat('strikethrough')} className={`p-1.5 rounded transition-colors ${formats.strikethrough ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><Strikethrough className="w-4 h-4" /></button>
                <button onClick={() => toggleFormat('superscript')} className={`p-1.5 rounded transition-colors ${formats.superscript ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><Superscript className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-app-border dark:bg-zinc-700 mx-1" />
                <button className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300 transition-colors"><Link2 className="w-4 h-4" /></button>
                <button className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300 transition-colors"><ImageIcon className="w-4 h-4" /></button>
                <button className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300 transition-colors"><PlaySquare className="w-4 h-4" /></button>
                <button onClick={() => toggleFormat('list')} className={`p-1.5 rounded transition-colors ${formats.list ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><List className="w-4 h-4" /></button>
                <button onClick={() => toggleFormat('orderedList')} className={`p-1.5 rounded transition-colors ${formats.orderedList ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><ListOrdered className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-app-border dark:bg-zinc-700 mx-1" />
                <button onClick={() => toggleFormat('quote')} className={`p-1.5 rounded transition-colors ${formats.quote ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><Quote className="w-4 h-4" /></button>
                <button onClick={() => toggleFormat('code')} className={`p-1.5 rounded transition-colors ${formats.code ? 'bg-[#E27D60]/20 text-[#E27D60]' : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300'}`}><Code className="w-4 h-4" /></button>
                <div className="ml-auto">
                  <button className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-gray dark:text-zinc-300 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
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
                onClick={handleSubmit}
                disabled={!title.trim()}
                className={`px-8 py-2 rounded-full font-black text-sm tracking-wider transition-all cursor-pointer ${
                  title.trim() 
                    ? 'bg-app-black hover:bg-zinc-800 text-white dark:bg-white dark:text-app-black dark:hover:bg-zinc-200' 
                    : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                Publish Tradition
              </button>
            </div>
          </div>
        )}

        {activeSubTab === 'Images' && (
          <div className="animate-fade-in flex flex-col gap-4">
            {!mediaPreview ? (
              <div className="h-[300px] border-2 border-dashed border-app-border dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-4 text-app-gray relative overflow-hidden group hover:border-[#E27D60] hover:bg-[#E27D60]/5 transition-all">
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setMediaPreview(URL.createObjectURL(file));
                  }}
                />
                <p className="text-sm font-bold group-hover:text-app-black dark:group-hover:text-white transition-colors">Drag and drop images or video here</p>
                <button className="px-6 py-2 rounded-full border border-app-border dark:border-zinc-700 font-extrabold text-sm group-hover:bg-[#E27D60] group-hover:text-white group-hover:border-[#E27D60] transition-colors relative z-0">
                  Select Media
                </button>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-app-border dark:border-zinc-800 bg-black flex items-center justify-center max-h-[400px]">
                <img src={mediaPreview} alt="Preview" className="max-h-[400px] w-auto object-contain" />
                <button 
                  onClick={() => setMediaPreview(null)}
                  className="absolute top-4 right-4 px-4 py-2 bg-black/60 text-white text-xs font-bold rounded-full hover:bg-black/80 transition-colors backdrop-blur-md cursor-pointer z-20"
                >
                  Change Media
                </button>
              </div>
            )}
            
            <div className="flex justify-end items-center mt-2">
              <button 
                onClick={handleSubmit}
                disabled={!mediaPreview}
                className={`px-8 py-2 rounded-full font-black text-sm tracking-wider transition-all cursor-pointer ${
                  mediaPreview 
                    ? 'bg-app-black hover:bg-zinc-800 text-white dark:bg-white dark:text-app-black dark:hover:bg-zinc-200' 
                    : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                Publish Tradition
              </button>
            </div>
          </div>
        )}

        {activeSubTab === 'Link' && (
          <div className="animate-fade-in">
            <textarea 
              placeholder="Url"
              className="w-full min-h-[100px] p-4 rounded-2xl border border-app-border dark:border-zinc-800 bg-transparent text-app-black dark:text-white font-semibold text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors resize-y"
            />
            <div className="flex justify-end items-center mt-4">
              <button 
                className="px-8 py-2 rounded-full font-black text-sm tracking-wider bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
              >
                Publish Tradition
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
