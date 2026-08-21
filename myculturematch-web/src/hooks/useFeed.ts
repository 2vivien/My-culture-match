import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService } from '@/src/services/feedService';
import { useAppStore } from '@/src/stores/useAppStore';
import { useUIStore } from '@/src/stores/useUIStore';
import type { Post } from '@/src/types/post';

function getFeedFilter(sort: string): 'following' | 'for-you' | 'popular' {
  if (sort === 'Popular') return 'popular'
  if (sort === 'Hot') return 'for-you'
  return 'following'
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
              ? { ...post, likes: post.likes + (isLiked ? -1 : 1) }
              : post
          )
        );
      }

      toggleLikedPost(postId)
      return { previousPosts, postId };
    },
    onError: (_err, _postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(queryKey, context.previousPosts);
        toggleLikedPost(context.postId)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
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
