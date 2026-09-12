import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, FlagTriangleLeft, X, Loader2, Repeat2, Check, Users } from 'lucide-react';
import { IconMessageCircle, IconReplace, IconShare3 } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/services/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/src/stores/useAppStore';
import { Avatar } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import { EmojiPicker } from '@/src/components/ui/EmojiPicker';
import { ShareModal } from './ShareModal';
import { useComments } from '@/src/hooks/useComments';
import { useUIStore } from '@/src/stores/useUIStore';
import { cn } from '@/src/lib/utils';

interface PostActionsProps {
  postId: string;
  commentsCount: number;
  likes: number;
  liked?: boolean;
  /** Auteur du post — pour empêcher de reposter soi-même. */
  authorId?: string;
  onLike: () => void;
}

interface MyTribe {
  id: string;
  name: string;
  avatar?: string | null;
}

/**
 * Actions d'un post : like, commentaire (envoi réel à l'API), emoji picker
 * complet, Repost (popup avec sélecteur de communauté) + Share (popup Partager
 * à la Instagram), et ouverture de la page détail (#/post/:id).
 */
export const PostActions = ({ postId, commentsCount, likes, liked, authorId, onLike }: PostActionsProps) => {
  const { currentUser } = useAppStore();
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setSelectedPostId = useAppStore((s) => s.setSelectedPostId);
  const queryClient = useQueryClient();
  const { addComment } = useComments(postId);
  const [comment, setComment] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRepost, setShowRepost] = useState(false);
  const [repostState, setRepostState] = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const [repostError, setRepostError] = useState('');
  const [selectedTribeId, setSelectedTribeId] = useState<string>('');

  const isMyPost = authorId !== undefined && authorId === currentUser?.id;

  // Communautés rejointes : même source que le créateur de tradition (tribes/mine).
  const { data: myTribes = [] } = useQuery<MyTribe[]>({
    queryKey: ['my-tribes'],
    queryFn: async () => {
      const data = await api.get<{ tribes?: MyTribe[] }>('/api/tribes/mine');
      return data?.tribes ?? [];
    },
    enabled: showRepost,
    staleTime: 1000 * 60 * 5,
  });

  const closeRepost = () => {
    setShowRepost(false);
    setRepostState('idle');
    setRepostError('');
    setSelectedTribeId('');
  };

  /** Repost réel : crée un post type=Repost dans la communauté choisie. */
  const handleRepost = async () => {
    if (!selectedTribeId) return;
    setRepostState('pending');
    setRepostError('');
    try {
      await api.post('/api/posts', {
        type: 'Repost',
        originalPostId: postId,
        tribeId: selectedTribeId,
      });
      setRepostState('done');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setTimeout(closeRepost, 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Repost impossible';
      setRepostError(message);
      setRepostState('error');
    }
  };

  const handleSendComment = () => {
    const text = comment.trim();
    if (!text) return;
    addComment.mutate({ text });
    setComment('');
    setShowEmoji(false);
  };

  const openPostDetail = () => {
    setSelectedPostId(postId);
    window.location.hash = `#/post/${postId}`;
    setActiveTab('PostDetail');
  };

  const appendEmoji = (emoji: string) => {
    setComment((prev) => prev + emoji);
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}#/post/${postId}`;
  const formatLikes = (num: number) => {
    if (num >= 10000) return `${(num / 1000).toFixed(0)}k`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`.replace('.0', '');
    return num;
  };

  return (
    <div className="flex flex-col gap-3 select-none w-full">
      {/* Rangée d'actions : like · commentaire · repost · share — tout à droite */}
      <div className="flex items-center justify-end gap-5 text-app-gray px-1">
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 transition-colors font-semibold text-sm cursor-pointer bg-transparent border-none ${liked ? 'text-[#E27D60]' : 'hover:text-[#E27D60] text-app-gray'}`}
          title="J'aime"
        >
          <FlagTriangleLeft className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          <span>{likes === 0 ? 'flag' : formatLikes(likes)}</span>
        </button>
        <button
          onClick={openPostDetail}
          className="flex items-center gap-1.5 hover:text-[#E27D60] transition-colors font-semibold text-sm cursor-pointer bg-transparent border-none text-app-gray"
          title="Voir la publication et tous les commentaires"
        >
          <IconMessageCircle size={20} />
          <span>{commentsCount > 0 ? commentsCount : ''}</span>
        </button>
        {/* Reposter (popup avec choix de la communauté) */}
        <button
          onClick={() => setShowRepost(true)}
          className="flex items-center gap-1.5 hover:text-[#E27D60] transition-colors font-semibold text-sm cursor-pointer bg-transparent border-none text-app-gray"
          title="Reposter dans une communauté"
        >
          <IconReplace size={20} />
        </button>
        {/* Partager */}
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-1.5 hover:text-[#E27D60] transition-colors font-semibold text-sm cursor-pointer bg-transparent border-none text-app-gray"
          title="Partager"
        >
          <IconShare3 size={20} />
        </button>
      </div>

      <div className="flex items-center w-full gap-3 relative mt-1">
        <Avatar src={currentUser?.avatar} alt={currentUser?.name} size="sm" />
        <div className="flex-1 bg-[#FCFCFC] dark:bg-zinc-900 rounded-full px-4 py-2.5 flex items-center border border-app-border focus-within:ring-1 focus-within:ring-[#E27D60]/20 transition-all relative">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
            placeholder="Write a comment..."
            className="bg-transparent border-none text-sm w-full focus:ring-0 outline-none placeholder-app-gray dark:text-zinc-300"
          />
          <Button
            variant="ghost"
            onClick={() => setShowEmoji((v) => !v)}
            className="p-1.5 text-app-gray hover:text-yellow-500 hover:bg-transparent cursor-pointer rounded-full min-w-0"
            title="Emojis"
          >
            <Smile className="w-4 h-4" />
          </Button>

          {showEmoji && (
            <EmojiPicker onSelect={appendEmoji} onClose={() => setShowEmoji(false)} />
          )}
        </div>
        <Button
          onClick={handleSendComment}
          disabled={!comment.trim() || addComment.isPending}
          size="icon"
          className="w-10 h-10 bg-[#E27D60] text-white hover:bg-[#c66b50] hover:scale-105"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-white">
            <path d="M3 20l3 -3" />
            <path d="M5 14a8 8 0 1 0 3.4 -9.3a8.06 8.06 0 0 0 -4.4 5.3l1 4z" />
          </svg>
        </Button>
      </div>

      {/* Popup Reposter : choix de la communauté où partager */}
      <AnimatePresence>
        {showRepost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[90] flex items-center justify-center p-4"
            onClick={() => repostState !== 'pending' && closeRepost()}
          >
            <motion.div
              initial={{ scale: 0.94, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 16, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="bg-white dark:bg-[#161b22] border border-app-border dark:border-zinc-800 rounded-[28px] w-full max-w-sm overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex items-center justify-center px-5 py-4 border-b border-app-border/60 dark:border-zinc-800/60">
                <button
                  type="button"
                  onClick={closeRepost}
                  disabled={repostState === 'pending'}
                  className="absolute left-5 w-8 h-8 rounded-full flex items-center justify-center text-app-black dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer bg-transparent border-none disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-base font-black text-app-black dark:text-zinc-100">Reposter</h3>
              </div>

              {repostState === 'done' ? (
                <div className="px-6 py-8 flex flex-col items-center text-center gap-3">
                  <span className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Check className="w-7 h-7 text-emerald-500" />
                  </span>
                  <p className="text-sm font-semibold text-app-black dark:text-zinc-200 leading-relaxed">
                    Reposté dans la communauté !
                  </p>
                </div>
              ) : (
                <>
                  <div className="px-6 pt-5 pb-3 flex flex-col gap-2 text-center">
                    <span className="mx-auto w-14 h-14 rounded-full bg-[#E27D60]/10 flex items-center justify-center">
                      <Repeat2 className="w-7 h-7 text-[#E27D60]" />
                    </span>
                    <p className="text-sm font-semibold text-app-black dark:text-zinc-200 leading-relaxed">
                      {isMyPost
                        ? 'Vous ne pouvez pas reposter votre propre publication.'
                        : 'Choisissez la communauté où partager cette publication :'}
                    </p>
                  </div>

                  {!isMyPost && (
                    <div className="px-5 pb-2 max-h-[220px] overflow-y-auto hide-scrollbar flex flex-col gap-1.5">
                      {myTribes.length === 0 ? (
                        <p className="text-sm text-app-gray text-center py-4">
                          Vous n'avez rejoint aucune communauté pour l'instant.
                        </p>
                      ) : (
                        myTribes.map((tribe) => (
                          <button
                            key={tribe.id}
                            type="button"
                            disabled={repostState === 'pending'}
                            onClick={() => setSelectedTribeId(tribe.id)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border text-left transition-all cursor-pointer bg-transparent disabled:opacity-60',
                              selectedTribeId === tribe.id
                                ? 'border-[#E27D60] bg-[#E27D60]/5'
                                : 'border-app-border/60 dark:border-zinc-800 hover:border-[#E27D60]/40 hover:bg-zinc-50 dark:hover:bg-zinc-900',
                            )}
                          >
                            <span className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4 text-app-gray" />
                            </span>
                            <span className="flex-1 min-w-0 text-sm font-bold text-app-black dark:text-zinc-200 truncate">
                              {tribe.name}
                            </span>
                            {selectedTribeId === tribe.id && (
                              <Check className="w-4.5 h-4.5 text-[#E27D60] shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {repostState === 'error' && repostError && (
                    <p className="px-6 pb-2 text-xs font-semibold text-red-500 text-center">{repostError}</p>
                  )}

                  <div className="px-5 pb-5 pt-3 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={closeRepost}
                      disabled={repostState === 'pending'}
                      className="flex-1 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-app-black dark:text-zinc-200 text-sm font-black hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-none disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleRepost}
                      disabled={!selectedTribeId || repostState === 'pending' || isMyPost}
                      className="flex-1 py-3 rounded-2xl bg-[#E27D60] hover:bg-[#c66b50] text-white text-sm font-black transition-colors cursor-pointer border-none disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {repostState === 'pending' && <Loader2 className="w-4 h-4 animate-spin" />}
                      Reposter
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup Partager (amis + réseaux) */}
      <ShareModal
        open={showShare}
        shareUrl={shareUrl}
        shareText="À voir sur My Culture Match :"
        onClose={() => setShowShare(false)}
      />
    </div>
  );
};
