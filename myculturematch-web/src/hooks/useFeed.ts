import { useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService } from '@/src/services/feedService';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import type { Post } from '@/src/types/post';

/**
 * Accueil (« Best ») = posts des tribus rejointes, classés Hot. Un compte sans tribu reçoit côté serveur
 * le feed « for-you » (repli), jamais un fil vide. « Popular » et « New » restent globaux.
 */
function getFeedFilter(sort: string): 'for-you' | 'popular' | 'new' | 'tribes' {
  if (sort === 'Popular') return 'popular'
  if (sort === 'New') return 'new'
  if (sort === 'Best') return 'tribes'
  return 'for-you'
}

export function useFeed() {
  const feedSort = useAppStore((s) => s.feedSort);
  const queryClient = useQueryClient();
  const likedPosts = useUIStore((s) => s.likedPosts);
  const toggleLikedPost = useUIStore((s) => s.toggleLikedPost);

  const queryKey = ['feed', feedSort];

  const { data: posts = [], isLoading, error } = useQuery<Post[]>({
    queryKey,
    queryFn: () => feedService.getPosts(getFeedFilter(feedSort)),
    staleTime: 1000 * 60 * 2,
  });

  // Réconciliation : si le serveur dit likedByMe mais que le local ne le sait
  // pas (ou inversement), l'état serveur gagne.
  useEffect(() => {
    if (!posts.length) return;
    const serverLiked = new Set(posts.filter((p) => p.likedByMe).map((p) => p.id));
    const stale = posts.filter((p) => likedPosts.includes(p.id) !== serverLiked.has(p.id));
    if (stale.length > 0) {
      stale.forEach((p) => {
        if (serverLiked.has(p.id) !== likedPosts.includes(p.id)) toggleLikedPost(p.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  const likePost = useMutation({
    mutationFn: feedService.likePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousPosts = queryClient.getQueryData<Post[]>(queryKey);
      const isLiked = likedPosts.includes(postId);

      if (previousPosts) {
        queryClient.setQueryData<Post[]>(
          queryKey,
          previousPosts.map((post) =>
            post.id === postId
              ? { ...post, likes: post.likes + (isLiked ? -1 : 1), likedByMe: !isLiked }
              : post
          )
        );
      }

      toggleLikedPost(postId)
      return { previousPosts, postId };
    },
    onSuccess: (result, postId) => {
      // L'état serveur fait foi : on applique le compte et le flag renvoyés.
      queryClient.setQueryData<Post[]>(queryKey, (old = []) =>
        old.map((post) =>
          post.id === postId
            ? { ...post, likes: result.likes, likedByMe: result.liked }
            : post
        )
      );
    },
    onError: (_err, _postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(queryKey, context.previousPosts);
        toggleLikedPost(context.postId)
      }
    },
  });

  const createPost = useMutation({
    mutationFn: feedService.createPost,
    onSuccess: (newPost) => {
      queryClient.setQueryData<Post[]>(queryKey, (old = []) => [newPost, ...old]);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const isPostLiked = useCallback((postId: string) => likedPosts.includes(postId), [likedPosts]);

  return {
    posts,
    isLoading,
    error,
    likePost: likePost.mutate,
    isPostLiked,
    createPost: createPost.mutate,
    isCreating: createPost.isPending,
  };
}
