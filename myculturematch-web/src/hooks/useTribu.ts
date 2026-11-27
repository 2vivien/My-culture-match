import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tribuService } from '@/src/services/tribuService';
import { useAppStore } from '@/src/stores/useAppStore';
import type { PostItem, TribeRule, TribeModerator } from '@/src/types/tribu';

/** Tri affiché → tri serveur (Best = les mieux notés, Hot = montée récente, New, Controversial). */
export type TribeSortType = 'Best' | 'Hot' | 'New' | 'Controversial';
const SERVER_SORT = { Best: 'top', Hot: 'hot', New: 'new', Controversial: 'controversial' } as const;

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
  const [sortType, setSortType] = useState<TribeSortType>('Best');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<Record<string, boolean>>({});
  const [mutedPostIds, setMutedPostIds] = useState<Record<string, boolean>>({});

  const { data: posts = [] } = useQuery<PostItem[]>({
    queryKey: ['tribu-posts', tribeId, sortType],
    queryFn: () => tribuService.fetchPosts(tribeId ?? undefined, SERVER_SORT[sortType]),
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
      // Tris classés (Best/Hot/Controversial) : un vote change le rang → on recharge l'ordre serveur
      // puis on abandonne la copie locale pour afficher ce nouvel ordre.
      if (sortType !== 'New') {
        void queryClient.invalidateQueries({ queryKey: ['tribu-posts', tribeId] }).then(() => setLocalPosts([]));
      }
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

  // Le tri est fait par le serveur (épinglés en tête, pagination cohérente).
  const sortedPosts = effectivePosts;

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
