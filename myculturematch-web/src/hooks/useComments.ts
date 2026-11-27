import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/services/api';

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

/** Nœud de commentaire (2 niveaux : commentaire + replies). */
export interface CommentNode extends BackendComment {
  replies: CommentNode[];
}

function buildTree(flat: BackendComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  const roots: CommentNode[] = [];
  flat.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export type CommentSort = 'best' | 'top' | 'new' | 'old';

export function useComments(postId: string, sort: CommentSort = 'best') {
  const queryClient = useQueryClient();
  const queryKey = ['comments', postId, sort];

  const { data: tree = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      // Le serveur renvoie l'arbre déjà trié (racines puis réponses) : on conserve cet ordre.
      const data = await api.get<{ comments: BackendComment[]; nextCursor: string | null }>(
        `/api/posts/${postId}/comments?limit=50&sort=${sort}`,
      );
      return buildTree(data.comments ?? []);
    },
    enabled: !!postId,
  });

  const addComment = useMutation({
    mutationFn: (input: { text: string; parentId?: string }) =>
      api.post<{ commentId: string }>(`/api/posts/${postId}/comments`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  });

  // Un vote change le score et peut changer le rang : on recharge l'ordre serveur.
  const voteComment = useMutation({
    mutationFn: (input: { commentId: string; value: 1 | -1 }) =>
      api.post<{ myVote: number; score: number }>(`/api/posts/${postId}/comments/${input.commentId}/vote`, { value: input.value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
  });

  return { comments: tree, isLoading, addComment, voteComment };
}
