import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tribuService } from '@/src/services/tribuService';
import { useAppStore } from '@/src/stores/useAppStore';
import type { PostItem, TribeRule, TribeModerator } from '@/src/types/tribu';

export interface TribeInfo {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  membersCount: number;
  createdAt: string;
  joined: boolean;
}

export function useTribu() {
  const tribeId = useAppStore((s) => s.selectedTribeId);
  const queryClient = useQueryClient();
  const [joined, setJoined] = useState(true);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [sortType, setSortType] = useState<'Best' | 'Hot' | 'New'>('Best');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<Record<string, boolean>>({});
  const [mutedPostIds, setMutedPostIds] = useState<Record<string, boolean>>({});

  const { data: posts = [] } = useQuery<PostItem[]>({
    queryKey: ['tribu-posts', tribeId],
    queryFn: () => tribuService.fetchPosts(tribeId ?? undefined),
    staleTime: 1000 * 60 * 5,
    enabled: !!tribeId,
  });

  const { data: rules = [] } = useQuery<TribeRule[]>({
    queryKey: ['tribu-rules', tribeId],
    queryFn: async () => {
      const rules = await tribuService.fetchRules(tribeId ?? undefined);
      return Array.isArray(rules) ? rules : [];
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!tribeId,
  });

  const { data: moderators = [] } = useQuery<TribeModerator[]>({
    queryKey: ['tribu-moderators', tribeId],
    queryFn: () => tribuService.fetchModerators(tribeId ?? undefined),
    staleTime: 1000 * 60 * 10,
    enabled: !!tribeId,
  });

  const { data: tribeInfo } = useQuery<TribeInfo | null>({
    queryKey: ['tribu-info', tribeId],
    queryFn: () => tribuService.fetchTribeInfo(tribeId ?? undefined),
    staleTime: 1000 * 60 * 5,
    enabled: !!tribeId,
  });

  useEffect(() => {
    const handleOutside = () => {
      setOpenMenuPostId(null);
    };
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, []);

  const [localPosts, setLocalPosts] = useState<PostItem[]>([]);
  const effectivePosts = localPosts.length > 0 ? localPosts : posts;

  // Quand le serveur renvoie de nouveaux posts (refresh), on repart de ses données.
  useEffect(() => {
    if (posts.length > 0) setLocalPosts([]);
  }, [posts]);

  /** Upvote réel : POST /api/tribu/posts/:id/upvote, puis l'état serveur fait foi. */
  const voteMutation = useMutation({
    mutationFn: (postId: string) => tribuService.votePost(postId, 1),
    onSuccess: (result, postId) => {
      setLocalPosts((prev) => {
        const base = prev.length > 0 ? prev : posts;
        return base.map((p) =>
          p.id === postId ? { ...p, upvotes: result.score, hasUpvoted: result.myVote === 1 } : p,
        );
      });
    },
  });

  const handleFlagClick = (postId: string) => {
    setLocalPosts((prev) => {
      const base = prev.length > 0 ? prev : posts;
      return base.map((p) => {
        if (p.id !== postId) return p;
        // Optimiste : on retourne le vote immédiatement, la réponse serveur corrige.
        if (p.hasUpvoted) return { ...p, upvotes: p.upvotes - 1, hasUpvoted: false };
        return { ...p, upvotes: p.upvotes + 1, hasUpvoted: true };
      });
    });
    voteMutation.mutate(postId);
  };

  const handleCommentChange = (postId: string, text: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  /** Commentaire réel : POST /api/posts/:id/comments + refresh du compteur. */
  const submitComment = (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    tribuService
      .addComment(postId, text)
      .then(() => {
        setLocalPosts((prev) => {
          const base = prev.length > 0 ? prev : posts;
          return base.map((p) =>
            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p,
          );
        });
        queryClient.invalidateQueries({ queryKey: ['tribu-posts', tribeId] });
      })
      .catch(() => undefined);
  };

  const safeRules = Array.isArray(rules) ? rules : [];

  const sortedPosts = [...effectivePosts].sort((a, b) => {
    if (sortType === 'Hot') return b.commentsCount - a.commentsCount;
    if (sortType === 'New') return b.id.localeCompare(a.id);
    return b.upvotes - a.upvotes;
  });

  return {
    joined,
    setJoined,
    notificationsOn,
    setNotificationsOn,
    sortType,
    setSortType,
    commentInputs,
    expandedRule,
    setExpandedRule,
    openMenuPostId,
    setOpenMenuPostId,
    copiedPostId,
    setCopiedPostId,
    savedPostIds,
    setSavedPostIds,
    mutedPostIds,
    setMutedPostIds,
    rules: safeRules,
    moderators,
    tribeInfo,
    sortedPosts,
    handleFlagClick,
    handleCommentChange,
    submitComment,
  };
}
