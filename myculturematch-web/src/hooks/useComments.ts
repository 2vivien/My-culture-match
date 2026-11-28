import { useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { api } from '@/src/services/api';
import { applyVoteToPages } from '@/src/lib/commentVote';
import { buildCommentTree, mergeCommentPages, type WithReplies } from '@/src/lib/commentTree';

/** Commentaire backend (liste plate avec parentId — replies inclus). */
export interface BackendComment {
  id: string;
  postId: string;
  parentId: string | null;
  text: string;
  status: string;
  likes: number;
  /** Votes (+1 / -1) : score net et vote du lecteur (0 si aucun). */
  score: number;
  myVote: number;
  createdAt: string;
  author: { id: string; name: string; username: string; avatar: string | null };
}

/** Nœud de commentaire : commentaire + réponses imbriquées (profondeur libre, plafonnée à l'affichage). */
export type CommentNode = WithReplies<BackendComment>;

const PAGE_SIZE = 30;

export type CommentSort = 'best' | 'top' | 'new' | 'old';

export function useComments(postId: string, sort: CommentSort = 'best') {
  const queryClient = useQueryClient();
  const queryKey = ['comments', postId, sort];

  // Chargement progressif : le curseur est une date (sort=new) ou un décalage numérique (best/top/old),
  // le serveur le renvoie tel quel dans nextCursor. Les pages sont fusionnées puis ré-arborescées.
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const qs = new URLSearchParams({ limit: String(PAGE_SIZE), sort });
      if (pageParam) qs.set('cursor', pageParam);
      return api.get<{ comments: BackendComment[]; nextCursor: string | null }>(`/api/posts/${postId}/comments?${qs.toString()}`);
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!postId,
  });

  // Le serveur renvoie les commentaires déjà triés : l'ordre des pages est conservé par la fusion.
  const tree = useMemo(
    () => buildCommentTree(mergeCommentPages((query.data?.pages ?? []).map((p) => p.comments ?? []))),
    [query.data],
  );

  const addComment = useMutation({
    mutationFn: (input: { text: string; parentId?: string }) =>
      api.post<{ commentId: string }>(`/api/posts/${postId}/comments`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  });

  // Le serveur renvoie le vote et le score à jour : on les applique au nœud dans toutes les listes en cache, sans
  // recharger les pages (la liste ne saute pas, et un double clic ne repart pas sur des données périmées).
  // L'ordre des tris « meilleurs/top » est rafraîchi au prochain chargement ; en tri par date il ne dépend pas du score.
  const voteComment = useMutation({
    mutationFn: (input: { commentId: string; value: 1 | -1 }) =>
      api.post<{ myVote: number; score: number }>(`/api/posts/${postId}/comments/${input.commentId}/vote`, { value: input.value }),
    onSuccess: (vote, input) => {
      queryClient.setQueriesData<InfiniteData<{ comments: BackendComment[]; nextCursor: string | null }>>(
        { queryKey: ['comments', postId] },
        (old) => (old ? { ...old, pages: applyVoteToPages(old.pages, input.commentId, vote) } : old),
      );
    },
  });

  return {
    comments: tree,
    isLoading: query.isLoading,
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => { void query.fetchNextPage(); },
    addComment,
    voteComment,
  };
}
