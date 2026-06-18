import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Send, Globe, Award, Shield } from 'lucide-react';
import { useFeed } from '@/src/hooks/useFeed';
import { useAppStore } from '@/src/stores/useAppStore';

interface CreateTraditionDialogProps {
  onClose: () => void;
}

export const CreateTraditionDialog: React.FC<CreateTraditionDialogProps> = ({ onClose }) => {
  const { createPost, isCreating } = useFeed();
  const { currentUser } = useAppStore();

  const [title, setTitle] = useState('');
  const [culture, setCulture] = useState('');
  const [description, setDescription] = useState('');
  const [symbol, setSymbol] = useState('🏺');

  const symbols = ['🏺', '🏮', '🥁', '🌸', '🎋', '🕌', '🏰', '🧿'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || isCreating) return;

    createPost({
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        location: currentUser.location,
      },
      text: `🏺 Shared a new Tradition: *${title.trim()}* (${culture.trim() || 'Global'})\n\n${description.trim()}`,
      date: 'Just now',
      tags: [culture.toLowerCase().replace(/\s+/g, ''), 'tradition', 'culture'],
    } as any);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/45 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-850 rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-app-border dark:border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-app-black dark:text-zinc-100">
                Transmit a New Tradition
              </h3>
              <p className="text-[10px] text-app-gray dark:text-zinc-500 font-bold uppercase tracking-wider">
                Publish ancestral rituals & global secrets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-app-border dark:border-zinc-850 flex items-center justify-center text-app-gray hover:text-app-black hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-app-gray dark:text-zinc-500 mb-1.5">
              Tradition Emblem / Icon
            </label>
            <div className="flex gap-2">
              {symbols.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setSymbol(sym)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border cursor-pointer transition-all ${
                    symbol === sym
                      ? 'bg-amber-500/10 border-amber-500 scale-110 shadow-sm'
                      : 'bg-zinc-55 dark:bg-zinc-900 border-app-border dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-app-gray dark:text-zinc-500 mb-1.5">
              Tradition Nom / Ceremony Name
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-lg select-none">{symbol}</span>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Benin's Vodoun Day, Japanese Kintsugi Arts"
                className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-app-border dark:border-zinc-850 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-app-black dark:text-zinc-100 transition-all placeholder:text-app-gray/70"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-app-gray dark:text-zinc-500 mb-1.5">
              Culture / Ancestral Origin Country
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-app-gray" />
              <input
                type="text"
                required
                value={culture}
                onChange={(e) => setCulture(e.target.value)}
                placeholder="e.g. Benin, Japan, Morocco, Indian Subcontinent"
                className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-app-border dark:border-zinc-850 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-app-black dark:text-zinc-100 transition-all placeholder:text-app-gray/70"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-app-gray dark:text-zinc-500 mb-1.5">
              Detailed Story & Ritual Practices
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the story of how it is conducted, the symbolic meaning, the secret recipe, or the physical movements of this ancient ceremony..."
              className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-app-border dark:border-zinc-850 rounded-2xl p-4 text-xs leading-relaxed font-semibold outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-app-black dark:text-zinc-100 transition-all placeholder:text-app-gray/70"
            />
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-app-border/60 dark:border-zinc-850/60 rounded-2xl p-3 flex gap-3 items-center">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-zinc-800 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <p className="text-[10px] text-app-gray dark:text-zinc-400 leading-normal font-medium">
              Transmitting a tradition increases your <span className="font-bold text-app-black dark:text-zinc-200">Cultural Synergy Level</span> in the global matchmaking index.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-black bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-app-black dark:text-zinc-200 rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !description.trim() || isCreating}
              className="flex-1 py-3 text-xs font-black bg-app-black dark:bg-white text-white dark:text-app-black hover:opacity-90 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Publishing...' : 'Publish'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
