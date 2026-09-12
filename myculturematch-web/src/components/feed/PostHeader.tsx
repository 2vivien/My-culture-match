import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Bookmark, Share2, BellOff, AlertTriangle, Check } from 'lucide-react';
import { TotemAvatar } from '@/src/components/ui/TotemAvatar';
import { Button } from '@/src/components/ui/button';
import { PostAuthor } from '@/src/types/post';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import { motion, AnimatePresence } from 'framer-motion';

interface PostHeaderProps {
  author: PostAuthor;
  date: string;
  tribe?: { id: string; name: string };
}

export const PostHeader = ({ author, date, tribe }: PostHeaderProps) => {
  const { setSelectedTotemUserId, currentUser, joinTribe } = useAppStore();
  const { setActiveTab } = useUIStore();
  const isMember = tribe ? currentUser.tribes.includes(tribe.name) : false;

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tribe) {
      joinTribe(tribe.name);
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [muted, setMuted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setSelectedTotemUserId(author.id);
    setActiveTab('Totem');
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const handleCopyLink = () => {
    setCopied(true);
    navigator.clipboard.writeText(window.location.href);
    setTimeout(() => {
      setCopied(false);
      setIsOpen(false);
    }, 1200);
  };

  const handleSavePost = () => {
    setSaved(!saved);
    setTimeout(() => {
      setIsOpen(false);
    }, 800);
  };

  const handleMute = () => {
    setMuted(!muted);
    setTimeout(() => {
      setIsOpen(false);
    }, 800);
  };

  return (
    <div className="flex items-center justify-between mb-4 select-none relative">
      <div className="flex items-center gap-3">
        <TotemAvatar
          src={author.avatar}
          alt={author.name}
          size="md"
          glow="none"
          onClick={handleClick}
        />
        <div>
          <h3 onClick={handleClick} className="font-bold text-sm cursor-pointer hover:underline text-app-black dark:text-zinc-300">
            {author.username || author.name}
          </h3>
          <p className="text-xs text-app-gray">{author.location}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-app-gray relative" ref={menuRef}>
        {tribe && (
          <div className="flex items-center gap-2 border-r border-app-border dark:border-zinc-800 pr-2">
            <span className="font-extrabold text-[9px] uppercase text-[#E27D60] tracking-wide select-none">
              t/{tribe.name}
            </span>
            {!isMember ? (
              <button
                type="button"
                onClick={handleJoin}
                className="px-2.5 py-0.5 rounded-full bg-[#E27D60] text-white text-[9px] font-black hover:scale-105 active:scale-95 transition-all cursor-pointer border-none outline-none"
              >
                Join
              </button>
            ) : (
              <span className="flex items-center text-green-600 dark:text-green-400 font-extrabold text-[9px] gap-0.5 select-none bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full">
                <Check className="w-2.5 h-2.5 stroke-[3px]" /> Joined
              </span>
            )}
          </div>
        )}
        <span>{date}</span>
        
        {/* Toggle standard menu */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full cursor-pointer text-app-gray hover:text-app-black dark:hover:text-zinc-200"
        >
          <MoreHorizontal className="w-5 h-5" />
        </Button>

        {/* Dynamic Options popup dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 w-52 bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-55 p-1.5"
            >
              <button
                onClick={handleSavePost}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-app-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Bookmark className={`w-4 h-4 ${saved ? 'text-amber-500 fill-amber-500' : 'text-app-gray'}`} />
                  {saved ? 'Tradition Saved!' : 'Save this Tradition'}
                </span>
                {saved && <Check className="w-3.5 h-3.5 text-amber-500" />}
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-app-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-app-gray" />
                  {copied ? 'Copied Link!' : 'Copy Link'}
                </span>
                {copied && <Check className="w-3.5 h-3.5 text-[#E27D60]" />}
              </button>

              <button
                onClick={handleMute}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-app-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BellOff className={`w-4 h-4 ${muted ? 'text-[#E27D60]' : 'text-app-gray'}`} />
                  {muted ? 'Muted Author' : 'Mute Notifications'}
                </span>
                {muted && <Check className="w-3.5 h-3.5 text-[#E27D60]" />}
              </button>

              <div className="border-t border-app-border/60 dark:border-zinc-800/60 my-1" />

              <button
                onClick={() => {
                  alert('Thank you for making this community safe. The cultural guardians team will review this traditional transmission.');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#E27D60] dark:text-[#E27D60] hover:bg-[#E27D60]/10 dark:hover:bg-[#E27D60]/20 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Report Content</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
