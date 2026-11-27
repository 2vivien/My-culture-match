import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tribuService } from '@/src/services/tribuService';
import { useAppStore } from '@/src/stores/useAppStore';
import type { PostItem, TribeRule, TribeModerator } from '@/src/types/tribu';
import {
  canModerate,
  getJoinAction,
  isTribePrivateError,
  joinResultMessage,
  type Flair,
  type JoinAction,
  type TribeRole,
  type TribeVisibility,
} from '@/src/lib/tribeAccess';

export interface TribeInfo {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  membersCount: number;
  createdAt: string;
  joined: boolean;
  visibility?: TribeVisibility;
  requestPending?: boolean;
  role?: string | null;
}

/** Requêtes à rafraîchir après un changement d'adhésion (l'état réel est celui du serveur). */
function invalidateMembership(queryClient: ReturnType<typeof useQueryClient>, tribeId: string) {
  const keys = [
    ['tribu-info', tribeId],
    ['tribu-posts', tribeId],
    ['tribu-flairs', tribeId],
    ['tribu-rules', tribeId],
    ['tribu-moderators', tribeId],
    ['tribu-join-requests', tribeId],
    ['my-tribes'],
    ['tribe-options'],
    ['explore'],
  ];
  return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function useTribu() {
  const tribeId = useAppStore((s) => s.selectedTribeId);
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [flairFilter, setFlairFilter] = useState<string | null>(null);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [sortType, setSortType] = useState<'Best' | 'Hot' | 'New'>('Best');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [savedPostIds, setSavedPostIds] = useState<Record<string, boolean>>({});
  const [mutedPostIds, setMutedPostIds] = useState<Record<string, boolean>>({});

  const {
    data: posts = [],
    error: postsError,
    isLoading: postsLoading,
    isError: postsIsError,
    refetch: refetchPosts,
  } = useQuery<PostItem[]>({
    queryKey: ['tribu-posts', tribeId, flairFilter],
    queryFn: () => tribuService.fetchPosts(tribeId ?? undefined, flairFilter),
    staleTime: 1000 * 60 * 5,
    enabled: !!tribeId,
    // Un 403 TRIBE_PRIVATE est un état normal (pas une panne) : inutile de réessayer.
    retry: (count, err) => !isTribePrivateError(err) && count < 1,
  });
  const postsPrivate = isTribePrivateError(postsError);

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

  const { data: tribeInfo, isLoading: infoLoading } = useQuery<TribeInfo | null>({
    queryKey: ['tribu-info', tribeId],
    queryFn: () => tribuService.fetchTribeInfo(tribeId ?? undefined),
    staleTime: 1000 * 60 * 5,
    enabled: !!tribeId,
  });

  const role = (tribeInfo?.role ?? null) as TribeRole;
  const isMod = canModerate(role);
  const joined = Boolean(tribeInfo?.joined);
  const visibility: TribeVisibility = tribeInfo?.visibility === 'private' ? 'private' : 'public';
  const contentLocked = postsPrivate || (visibility === 'private' && !joined && !!tribeInfo);

  const joinAction: JoinAction | null = tribeInfo
    ? getJoinAction({ visibility, joined, requestPending: Boolean(tribeInfo.requestPending), role })
    : null;

  // Flairs : 403 pour un non-membre d'une tribu privée, donc requête coupée dans ce cas.
  const { data: flairs = [] } = useQuery<Flair[]>({
    queryKey: ['tribu-flairs', tribeId],
    queryFn: () => tribuService.getFlairs(tribeId as string),
    staleTime: 1000 * 60 * 5,
    enabled: !!tribeId && !!tribeInfo && !contentLocked,
    retry: false,
  });

  // Demandes d'adhésion : réservées aux modérateurs (le serveur renvoie 403 sinon).
  const joinRequestsQuery = useQuery({
    queryKey: ['tribu-join-requests', tribeId],
    queryFn: () => tribuService.getJoinRequests(tribeId as string),
    enabled: !!tribeId && isMod && visibility === 'private',
    staleTime: 1000 * 30,
  });

  const showError = (err: unknown, fallback: string) => {
    setFeedback({ type: 'error', text: err instanceof Error && err.message ? err.message : fallback });
  };

  const membershipMutation = useMutation({
    mutationFn: async (kind: JoinAction['kind']) => {
      if (!tribeId) throw new Error('Aucune tribu sélectionnée');
      if (kind === 'join' || kind === 'request') return { kind, join: await tribuService.join(tribeId) };
      if (kind === 'leave') await tribuService.leave(tribeId);
      if (kind === 'cancel-request') await tribuService.cancelJoinRequest(tribeId);
      return { kind, join: null };
    },
    onSuccess: async (result) => {
      if (result.join) setFeedback({ type: 'success', text: joinResultMessage(result.join) });
      else if (result.kind === 'leave') setFeedback({ type: 'success', text: 'Vous avez quitté la tribu.' });
      else if (result.kind === 'cancel-request') setFeedback({ type: 'success', text: 'Demande annulée.' });
      if (tribeId) await invalidateMembership(queryClient, tribeId);
    },
    onError: (err) => showError(err, 'Action impossible pour le moment'),
  });

  const resolveRequestMutation = useMutation({
    mutationFn: ({ userId, approve }: { userId: string; approve: boolean }) =>
      tribuService.resolveJoinRequest(tribeId as string, userId, approve),
    onSuccess: async (_r, vars) => {
      setFeedback({ type: 'success', text: vars.approve ? 'Demande approuvée.' : 'Demande refusée.' });
      if (tribeId) await invalidateMembership(queryClient, tribeId);
    },
    onError: (err) => showError(err, 'Impossible de traiter la demande'),
  });

  const createFlairMutation = useMutation({
    mutationFn: (input: { name: string; color: string }) => tribuService.createFlair(tribeId as string, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tribu-flairs', tribeId] }),
  });

  const deleteFlairMutation = useMutation({
    mutationFn: (flairId: string) => tribuService.deleteFlair(tribeId as string, flairId),
    onSuccess: async (_r, flairId) => {
      if (flairFilter === flairId) setFlairFilter(null);
      await queryClient.invalidateQueries({ queryKey: ['tribu-flairs', tribeId] });
      await queryClient.invalidateQueries({ queryKey: ['tribu-posts', tribeId] });
    },
    onError: (err) => showError(err, 'Suppression du flair impossible'),
  });

  const setPostFlairMutation = useMutation({
    mutationFn: ({ postId, flairId }: { postId: string; flairId: string | null }) =>
      tribuService.setPostFlair(tribeId as string, postId, flairId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tribu-posts', tribeId] }),
    onError: (err) => showError(err, 'Changement de flair impossible'),
  });

  // Changer de tribu réinitialise filtre et message.
  useEffect(() => {
    setFlairFilter(null);
    setFeedback(null);
  }, [tribeId]);

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

  // Changement de tribu ou de filtre : plus aucune donnée locale périmée.
  useEffect(() => {
    setLocalPosts([]);
  }, [tribeId, flairFilter]);

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

  const sortedPosts = contentLocked
    ? []
    : [...effectivePosts].sort((a, b) => {
        if (sortType === 'Hot') return b.commentsCount - a.commentsCount;
        if (sortType === 'New') return b.id.localeCompare(a.id);
        return b.upvotes - a.upvotes;
      });

  return {
    // Adhésion (état réel du serveur)
    joined,
    role,
    isMod,
    visibility,
    infoLoading,
    joinAction,
    runJoinAction: (kind: JoinAction['kind']) => membershipMutation.mutate(kind),
    membershipPending: membershipMutation.isPending,
    feedback,
    clearFeedback: () => setFeedback(null),
    contentLocked,
    postsLoading,
    postsFailed: postsIsError && !postsPrivate,
    refetchPosts,
    // Flairs
    flairs,
    flairFilter,
    setFlairFilter,
    createFlair: createFlairMutation.mutateAsync,
    creatingFlair: createFlairMutation.isPending,
    deleteFlair: (id: string) => deleteFlairMutation.mutate(id),
    deletingFlairId: deleteFlairMutation.isPending ? (deleteFlairMutation.variables ?? null) : null,
    setPostFlair: (postId: string, flairId: string | null) => setPostFlairMutation.mutate({ postId, flairId }),
    // Demandes d'adhésion (modérateurs)
    joinRequests: joinRequestsQuery.data ?? [],
    joinRequestsLoading: joinRequestsQuery.isLoading,
    joinRequestsError: joinRequestsQuery.isError,
    refetchJoinRequests: joinRequestsQuery.refetch,
    resolveJoinRequest: (userId: string, approve: boolean) => resolveRequestMutation.mutate({ userId, approve }),
    resolvingUserId: resolveRequestMutation.isPending ? (resolveRequestMutation.variables?.userId ?? null) : null,
    // Reste
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
