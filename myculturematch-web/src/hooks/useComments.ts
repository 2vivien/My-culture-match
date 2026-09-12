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

export function useComments(postId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['comments', postId];

  const { data: tree = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      // Le backend trie desc — on remet en ordre chronologique.
      const data = await api.get<{ comments: BackendComment[]; nextCursor: string | null }>(
        `/api/posts/${postId}/comments?limit=50`,
      );
      return buildTree([...(data.comments ?? [])].reverse());
    },
    enabled: !!postId,
  });

  const addComment = useMutation({
    mutationFn: (input: { text: string; parentId?: string }) =>
      api.post<{ commentId: string }>(`/api/posts/${postId}/comments`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { comments: tree, isLoading, addComment };
}
