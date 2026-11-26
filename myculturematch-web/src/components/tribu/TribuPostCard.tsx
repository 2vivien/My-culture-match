import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlagTriangleLeft, MoreHorizontal, Bookmark, Share2, BellOff, AlertTriangle, Check, MessageCircle } from 'lucide-react';
import type { PostItem } from '@/src/types/tribu';

interface TribuPostCardProps {
  post: PostItem;
  tribeName?: string;
  commentInput: string;
  isMenuOpen: boolean;
  isSaved: boolean;
  isMuted: boolean;
  isCopied: boolean;
  onFlagClick: () => void;
  onMenuToggle: (e: React.MouseEvent) => void;
  onSaveToggle: () => void;
  onMuteToggle: () => void;
  onCopyLink: () => void;
  onReport: () => void;
  onCommentChange: (text: string) => void;
  onCommentSubmit: () => void;
}

export const TribuPostCard: React.FC<TribuPostCardProps> = ({
  post,
  tribeName,
  commentInput,
  isMenuOpen,
  isSaved,
  isMuted,
  isCopied,
  onFlagClick,
  onMenuToggle,
  onSaveToggle,
  onMuteToggle,
  onCopyLink,
  onReport,
  onCommentChange,
  onCommentSubmit,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900/60 border border-app-border dark:border-zinc-800 rounded-[20px] p-5 shadow-xs flex flex-col hover:shadow-sm transition-shadow relative">
      <div className="flex items-center justify-between border-b border-app-border/40 dark:border-zinc-800 pb-3 mb-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={onFlagClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black transition-colors cursor-pointer ${
              post.hasUpvoted
                ? 'bg-[#E27D60]/10 border-[#E27D60]/30 text-[#E27D60] dark:bg-[#E27D60]/10 dark:text-[#E27D60] dark:border-[#E27D60]/30'
                : 'bg-zinc-50 dark:bg-zinc-800 border-app-border dark:border-zinc-800 text-app-gray hover:text-app-black dark:hover:text-zinc-200'
            }`}
            title="Add match flag"
          >
            <FlagTriangleLeft className={`w-4 h-4 fill-current ${post.hasUpvoted ? 'text-[#E27D60]' : 'text-app-gray'}`} />
            <span>{post.upvotes}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-app-gray dark:text-zinc-400 font-medium">
            <span className="font-black text-[#E27D60] dark:text-[#E27D60]">
              t/{tribeName ?? 'Tribu'}
            </span>
            <span>•</span>
            <span className="font-extrabold text-app-black dark:text-zinc-300">
              {post.author}
            </span>
            <span>•</span>
            <span>{post.timeAgo}</span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={onMenuToggle}
            className="text-app-gray hover:text-app-black dark:hover:text-white cursor-pointer p-1 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center"
          >
            <MoreHorizontal className="w-4.5 h-4.5" />
          </button>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-7 w-52 bg-white dark:bg-zinc-950 border border-app-border dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-55 p-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={onSaveToggle}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-app-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-app-gray" />
                    {isSaved ? 'Post Saved!' : 'Save this Post'}
                  </span>
                  {isSaved && <Check className="w-3.5 h-3.5 text-[#E27D60]" />}
                </button>

                <button
                  onClick={onCopyLink}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-app-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-app-gray" />
                    {isCopied ? 'Copied Link!' : 'Copy Link'}
                  </span>
                  {isCopied && <Check className="w-3.5 h-3.5 text-[#E27D60]" />}
                </button>

                <button
                  onClick={onMuteToggle}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-app-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BellOff className={`w-4 h-4 ${isMuted ? 'text-[#E27D60]' : 'text-app-gray'}`} />
                    {isMuted ? 'Muted Author' : 'Mute Notifications'}
                  </span>
                  {isMuted && <Check className="w-3.5 h-3.5 text-[#E27D60]" />}
                </button>

                <div className="border-t border-app-border/60 dark:border-zinc-800/60 my-1" />

                <button
                  onClick={onReport}
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

      <div className="min-w-0">
        <h3 className="font-black text-sm sm:text-base text-app-black dark:text-zinc-100 leading-snug">
          {post.title}
        </h3>
        <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-2.5 ${post.tagColor}`}>
          {post.tagText}
        </span>

        {post.mediaUrl && (
          <div className="mt-4 rounded-xl overflow-hidden border border-app-border dark:border-zinc-800 max-h-96">
            <img
              src={post.mediaUrl}
              alt="Post Attachment"
              className="w-full object-cover"
            />
          </div>
        )}

        <div className="mt-4.5 pt-4 border-t border-app-border/40 dark:border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-app-gray dark:text-zinc-400 font-bold">
            <MessageCircle className="w-4 h-4 text-app-gray dark:text-zinc-400" />
            <span>{post.commentsCount} comments shared</span>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Write a comment beat..."
              value={commentInput}
              onChange={(e) => onCommentChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCommentSubmit();
              }}
              className="flex-1 px-4 py-2 text-xs rounded-xl border border-app-border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-app-black dark:text-zinc-300 focus:outline-none focus:border-[#E27D60] focus:ring-1 focus:ring-[#E27D60]"
            />
            <button
              onClick={onCommentSubmit}
              className="p-2 bg-[#E27D60] hover:bg-[#c66b50] text-white rounded-xl cursor-pointer transition-colors flex items-center justify-center shrink-0 w-8.5 h-8.5"
              title="Send comment"
            >
              <MessageCircle className="w-4.5 h-4.5 fill-current text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
