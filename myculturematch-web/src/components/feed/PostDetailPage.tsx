import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowBigUp, ArrowBigDown, FlagTriangleLeft, Smile, Loader2, X, Repeat2, Check, Users } from 'lucide-react';
import { IconMessageCircle, IconReplace, IconShare3 } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/services/api';
import { PostHeader } from '@/src/components/feed/PostHeader';
import { ShareModal } from '@/src/components/feed/ShareModal';
import { ProfileAvatar } from '@/src/components/ui/ProfileAvatar';
import { EmojiPicker } from '@/src/components/ui/EmojiPicker';
import { useComments, type CommentNode, type CommentSort } from '@/src/hooks/useComments';
import { countAll, findNode, flattenVisible, MAX_COMMENT_DEPTH, toggleCollapsed, type VisibleComment } from '@/src/lib/commentTree';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import { fallbackAvatar } from '@/src/lib/media';
import { cn } from '@/src/lib/utils';
import type { Post } from '@/src/types/post';

/**
 * Page détail d'une publication (#/post/:id) : post complet (titre, image,
 * tags, like réel) + TOUS les commentaires (arbre avec réponses), réponse par
 * commentaire, emoji picker complet.
 */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/** Retrait par niveau : 0 pour une racine, puis un pas réduit pour ne pas écraser le texte en profondeur. */
function indentPx(depth: number): number {
  return depth === 0 ? 0 : 40 + (depth - 1) * 16;
}

const linkButton = 'hover:text-app-black dark:hover:text-zinc-300 transition-colors cursor-pointer bg-transparent border-none p-0';

/** Un commentaire de la liste aplatie : le repli et le plafond de profondeur sont calculés par flattenVisible. */
const CommentItem: React.FC<{
  item: VisibleComment<CommentNode>;
  onReply: (node: CommentNode) => void;
  onVote: (commentId: string, value: 1 | -1) => void;
  /** Un vote est en cours : les boutons sont désactivés (pas de double clic qui annule le vote). */
  voting?: boolean;
  onToggle: (commentId: string) => void;
  onContinue: (commentId: string) => void;
}> = ({ item, onReply, onVote, voting = false, onToggle, onContinue }) => {
  const { node, depth, descendants, collapsed, continueThread } = item;
  const hasReplies = node.replies.length > 0;
  return (
  <div className="flex flex-col" style={{ marginLeft: indentPx(depth) }}>
    <div className="flex items-start gap-3">
      {/* Style Instagram : avatar · username en gras · texte · date dessous · Répondre */}
      <ProfileAvatar
        src={node.author.avatar ?? fallbackAvatar(node.author.name)}
        alt={node.author.name}
        size="md"
        glow="none"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed text-app-black dark:text-zinc-100 whitespace-pre-wrap break-words">
          <span className="font-black mr-1.5">
            {node.author.username || node.author.name}
          </span>
          {node.text}
        </p>
        <div className="flex items-center gap-4 mt-1 text-[11px] font-bold text-app-gray dark:text-zinc-500 select-none">
          <span className="font-medium">{timeAgo(node.createdAt)}</span>
          <span className="flex items-center gap-0.5" aria-label={`Score ${node.score}`}>
            <button
              type="button"
              aria-label="Voter pour"
              aria-pressed={node.myVote === 1}
              disabled={voting}
              onClick={() => onVote(node.id, 1)}
              className={cn('cursor-pointer bg-transparent border-none p-0 transition-colors', node.myVote === 1 ? 'text-[#8B4A2B]' : 'hover:text-app-black dark:hover:text-zinc-300')}
            >
              <ArrowBigUp className="w-4 h-4" />
            </button>
            <span className="min-w-4 text-center tabular-nums">{node.score}</span>
            <button
              type="button"
              aria-label="Voter contre"
              aria-pressed={node.myVote === -1}
              disabled={voting}
              onClick={() => onVote(node.id, -1)}
              className={cn('cursor-pointer bg-transparent border-none p-0 transition-colors', node.myVote === -1 ? 'text-blue-500' : 'hover:text-app-black dark:hover:text-zinc-300')}
            >
              <ArrowBigDown className="w-4 h-4" />
            </button>
          </span>
          <button type="button" onClick={() => onReply(node)} className={linkButton}>
            Répondre
          </button>
          {hasReplies && (
            <button
              type="button"
              aria-expanded={!collapsed}
              aria-label={collapsed ? `Déplier ${descendants} ${descendants > 1 ? 'réponses' : 'réponse'}` : 'Replier les réponses'}
              onClick={() => onToggle(node.id)}
              className={linkButton}
            >
              {collapsed ? `${descendants} ${descendants > 1 ? 'réponses' : 'réponse'}` : 'Replier'}
            </button>
          )}
        </div>
        {continueThread && (
          <button type="button" onClick={() => onContinue(node.id)} className={cn(linkButton, 'mt-1 text-[11px] font-bold text-[#8B4A2B]')}>
            Continuer ce fil ({descendants} {descendants > 1 ? 'réponses' : 'réponse'}) →
          </button>
        )}
      </div>
    </div>
  </div>
  );
};

export const PostDetailPage: React.FC = () => {
  const postId = useAppStore((s) => s.selectedPostId);
  const currentUser = useAppStore((s) => s.currentUser);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const openAuthModal = useUIStore((s) => s.openAuthModal);
  const queryClient = useQueryClient();
  const [commentSort, setCommentSort] = useState<CommentSort>('best');
  const { comments, isLoading: loadingComments, hasMore, loadingMore, loadMore, addComment, voteComment } = useComments(postId, commentSort);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRepost, setShowRepost] = useState(false);
  const [repostState, setRepostState] = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const [repostError, setRepostError] = useState('');
  const [selectedTribeId, setSelectedTribeId] = useState<string>('');

  // Communautés rejointes : même source que PostActions (tribes/mine).
  const { data: myTribes = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['my-tribes'],
    queryFn: async () => {
      const data = await api.get<{ tribes?: Array<{ id: string; name: string }> }>('/api/tribes/mine');
      return data?.tribes ?? [];
    },
    enabled: showRepost && isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => api.get<Post & { likedByMe?: boolean; mediaUrls?: string[]; tags?: string[] }>(`/api/posts/${postId}`),
    enabled: !!postId,
  });

  /** Like réel : POST /api/posts/:id/like puis refresh du post. */
  const toggleLike = async () => {
    if (!postId) return;
    try {
      await api.post<{ liked: boolean; likes: number }>(`/api/posts/${postId}/like`);
      await queryClient.invalidateQueries({ queryKey: ['post', postId] });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch {
      // silencieux
    }
  };

  /** Repost réel : crée un post type=Repost dans la communauté choisie (identique à PostActions). */
  const handleRepost = async () => {
    if (!postId || !selectedTribeId) return;
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
      setTimeout(() => {
        setShowRepost(false);
        setRepostState('idle');
        setSelectedTribeId('');
      }, 1200);
    } catch (err) {
      setRepostError(err instanceof Error ? err.message : 'Repost impossible');
      setRepostState('error');
    }
  };

  if (!postId) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-app-gray">
        Aucune publication sélectionnée.
      </div>
    );
  }

  if (isLoading || !post) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-app-gray" />
      </div>
    );
  }

  const p = post as unknown as Record<string, unknown>;
  const author = p.author as Record<string, string> | undefined;
  const isMyPost = Boolean(author?.id) && author?.id === currentUser?.id;
  const likedByMe = Boolean(p.likedByMe);
  const tags = (p.tags as string[]) ?? [];
  const images = (p.mediaUrls as string[]) ?? [];
  const totalComments = countAll(comments);
  // « Continuer ce fil » : on affiche le sous-arbre du commentaire choisi, repartant à la profondeur 0.
  const focusNode = focusId ? findNode(comments, focusId) : null;
  const visibleComments = flattenVisible(focusNode ? [focusNode] : comments, collapsed, MAX_COMMENT_DEPTH);
  const goBack = () => {
    window.location.hash = '#/';
    setActiveTab('Home');
  };

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    addComment.mutate({ text: t, parentId: replyTo?.id });
    setText('');
    setReplyTo(null);
    setShowEmoji(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex-1 max-w-2xl w-full mx-auto flex flex-col h-full pb-6"
    >
      {/* Retour */}
      <button
        type="button"
        onClick={goBack}
        className="w-fit flex items-center gap-2 text-xs font-bold text-app-gray hover:text-app-black dark:hover:text-white mb-3 cursor-pointer bg-transparent border-none"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au feed
      </button>

      {/* Post */}
      <article className="bg-white dark:bg-zinc-950 rounded-[24px] p-5 shadow-soft border border-app-border dark:border-zinc-800">
        {author && (
          <PostHeader
            author={{
              id: author.id ?? '',
              name: author.name ?? '',
              username: author.username ?? '',
              avatar: author.avatar ?? '',
              location: author.location ?? '',
            }}
            date={timeAgo((post as unknown as Record<string, unknown>).createdAt as string)}
            tribe={(post as unknown as Record<string, unknown>).tribe as { id: string; name: string } | undefined}
          />
        )}
        {Boolean(p.title) && (
          <h2 className="text-lg font-black text-app-black dark:text-zinc-100 leading-snug mb-1.5">{p.title as string}</h2>
        )}
        <p className="text-sm font-semibold text-app-black dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {(p.body as string) || (p.text as string)}
        </p>
        {images.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="rounded-2xl max-h-[420px] w-full object-cover border border-app-border dark:border-zinc-800"
              />
            ))}
          </div>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <span key={tag} className="text-xs font-black text-[#8B4A2B]">#{tag}</span>
            ))}
          </div>
        )}

        {/* Même rangée d'actions que PostActions : like · commentaire · repost · share — tout à droite */}
        <div className="flex items-center justify-end gap-5 mt-4 pt-3 border-t border-app-border dark:border-zinc-800 text-app-gray text-sm font-semibold px-1">
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={openAuthModal}
              className="rounded-full bg-[#8B4A2B] hover:bg-[#6F3A22] text-white text-xs font-black px-4 py-2 cursor-pointer border-none"
            >
              Connecte-toi pour interagir
            </button>
          ) : (
          <>
          <button
            type="button"
            onClick={toggleLike}
            className={cn(
              'flex items-center gap-1.5 cursor-pointer bg-transparent border-none transition-colors font-semibold text-sm',
              likedByMe ? 'text-[#8B4A2B]' : 'hover:text-[#8B4A2B]',
            )}
            title="J'aime"
          >
            <FlagTriangleLeft className={cn('w-5 h-5', likedByMe && 'fill-current')} />
            {(p.likes as number) ?? 0}
          </button>
          <span className="flex items-center gap-1.5 font-semibold text-sm" title="Commentaires">
            <IconMessageCircle size={20} />
            {totalComments}
          </span>
          {/* Reposter */}
          <button
            type="button"
            onClick={() => setShowRepost(true)}
            className="flex items-center gap-1.5 hover:text-[#8B4A2B] transition-colors font-semibold text-sm cursor-pointer bg-transparent border-none text-app-gray"
            title="Reposter"
          >
            <IconReplace size={20} />
          </button>
          {/* Partager */}
          <button
            type="button"
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 hover:text-[#8B4A2B] transition-colors font-semibold text-sm cursor-pointer bg-transparent border-none text-app-gray"
            title="Partager"
          >
            <IconShare3 size={20} />
          </button>
          </>
          )}
        </div>
      </article>

      {/* Popup Reposter : identique à PostActions (choix de la communauté) */}
      <AnimatePresence>
        {showRepost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[90] flex items-center justify-center p-4"
            onClick={() => repostState !== 'pending' && setShowRepost(false)}
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
                  onClick={() => setShowRepost(false)}
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
                    <span className="mx-auto w-14 h-14 rounded-full bg-[#8B4A2B]/10 flex items-center justify-center">
                      <Repeat2 className="w-7 h-7 text-[#8B4A2B]" />
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
                                ? 'border-[#8B4A2B] bg-[#8B4A2B]/5'
                                : 'border-app-border/60 dark:border-zinc-800 hover:border-[#8B4A2B]/40 hover:bg-zinc-50 dark:hover:bg-zinc-900',
                            )}
                          >
                            <span className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4 text-app-gray" />
                            </span>
                            <span className="flex-1 min-w-0 text-sm font-bold text-app-black dark:text-zinc-200 truncate">
                              {tribe.name}
                            </span>
                            {selectedTribeId === tribe.id && (
                              <Check className="w-4.5 h-4.5 text-[#8B4A2B] shrink-0" />
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
                      onClick={() => setShowRepost(false)}
                      disabled={repostState === 'pending'}
                      className="flex-1 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-app-black dark:text-zinc-200 text-sm font-black hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-none disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleRepost}
                      disabled={!selectedTribeId || repostState === 'pending' || isMyPost}
                      className="flex-1 py-3 rounded-2xl bg-[#8B4A2B] hover:bg-[#6F3A22] text-white text-sm font-black transition-colors cursor-pointer border-none disabled:opacity-50 flex items-center justify-center gap-2"
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

      {/* Popup Partager : identique à PostActions */}
      <ShareModal
        open={showShare}
        shareUrl={`${window.location.origin}${window.location.pathname}#/post/${postId}`}
        shareText="À voir sur My Culture Match :"
        onClose={() => setShowShare(false)}
      />

      {/* Commentaires */}
      <h3 className="text-xs font-black uppercase tracking-wider text-app-gray mt-6 mb-3 px-1">
        Commentaires ({totalComments}{hasMore ? '+' : ''})
      </h3>
      <div className="flex gap-1.5 mb-3" role="group" aria-label="Trier les commentaires">
        {([['best', 'Meilleurs'], ['top', 'Top'], ['new', 'Récents'], ['old', 'Anciens']] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={commentSort === value}
            onClick={() => setCommentSort(value)}
            className={cn('px-3 py-1 rounded-full text-[11px] font-black cursor-pointer border-none transition-colors', commentSort === value ? 'bg-zinc-100 dark:bg-zinc-800 text-[#8B4A2B]' : 'bg-transparent text-app-gray hover:text-app-black dark:hover:text-zinc-200')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-1 hide-scrollbar">
        {loadingComments ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-app-gray" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-sm text-app-gray py-8">
            Aucun commentaire pour l'instant. Soyez le premier à répondre !
          </p>
        ) : (
          <>
            {focusNode && (
              <button type="button" onClick={() => setFocusId(null)} className={cn(linkButton, 'self-start text-[11px] font-bold text-[#8B4A2B]')}>
                ← Tous les commentaires
              </button>
            )}
            {visibleComments.map((item) => (
              <CommentItem
                key={item.node.id}
                item={item}
                onReply={setReplyTo}
                onVote={(commentId, value) => voteComment.mutate({ commentId, value })}
                voting={voteComment.isPending}
                onToggle={(id) => setCollapsed((prev) => toggleCollapsed(prev, id))}
                onContinue={setFocusId}
              />
            ))}
            {hasMore && !focusNode && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="self-center text-[12px] font-black text-[#8B4A2B] bg-transparent border-none cursor-pointer disabled:opacity-60 py-1"
              >
                {loadingMore ? 'Chargement…' : 'Voir plus de commentaires'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Répondre à */}
      {replyTo && (
        <div className="flex items-center justify-between bg-[#8B4A2B]/10 border border-[#8B4A2B]/30 rounded-xl px-3 py-1.5 mt-3">
          <span className="text-[11px] font-bold text-[#8B4A2B] truncate">
            Réponse à {replyTo.author.name}
          </span>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="text-[11px] font-bold text-app-gray hover:text-app-black cursor-pointer bg-transparent border-none"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Composer un commentaire — réservé aux membres. */}
      {isAuthenticated && (
      <div className="mt-3 flex items-center gap-2.5">
        <ProfileAvatar src={currentUser.avatar} alt={currentUser.name} size="md" glow="none" />
        <div className="flex-1 bg-[#FCFCFC] dark:bg-zinc-900 rounded-full px-4 py-2.5 flex items-center gap-1 border border-app-border focus-within:ring-1 focus-within:ring-[#8B4A2B]/30 transition-all relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={replyTo ? `Répondre à ${replyTo.author.name}...` : 'Ajouter un commentaire...'}
            className="flex-1 bg-transparent text-sm outline-none placeholder-app-gray dark:text-zinc-200 border-none"
          />
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className="p-1 text-app-gray hover:text-yellow-500 cursor-pointer bg-transparent border-none"
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </button>
          {showEmoji && <EmojiPicker onSelect={(e) => setText((p) => p + e)} onClose={() => setShowEmoji(false)} />}
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || addComment.isPending}
          className="h-10 px-5 rounded-full bg-[#8B4A2B] hover:bg-[#6F3A22] disabled:opacity-50 text-white text-sm font-black cursor-pointer border-none shrink-0"
        >
          {addComment.isPending ? '...' : 'Publier'}
        </button>
      </div>
      )}
    </motion.div>
  );
};
