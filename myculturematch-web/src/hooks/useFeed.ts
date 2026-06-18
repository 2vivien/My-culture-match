import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feedService } from '@/src/services/feedService';
import { useAppStore } from '@/src/stores/useAppStore';
import type { Post } from '@/src/types/post';

export function useFeed() {
  const feedSort = useAppStore((s) => s.feedSort);
  const feedCulture = useAppStore((s) => s.feedCulture);
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading, error } = useQuery<Post[]>({
    queryKey: ['feed', feedSort, feedCulture],
    queryFn: () => {
      const filter = feedSort === 'Popular' || feedSort === 'Hot' ? 'for-you' : 'following';
      return feedService.getPosts(filter);
    },
    staleTime: 1000 * 60 * 2,
  });

  const likePost = useMutation({
    mutationFn: feedService.likePost,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed', feedSort, feedCulture] });
      const previousPosts = queryClient.getQueryData<Post[]>(['feed', feedSort, feedCulture]);

      if (previousPosts) {
        queryClient.setQueryData<Post[]>(
          ['feed', feedSort, feedCulture],
          previousPosts.map((post) =>
            post.id === postId ? { ...post, likes: post.likes + 1 } : post
          )
        );
      }
      return { previousPosts };
    },
    onError: (_err, _postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['feed', feedSort, feedCulture], context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const createPost = useMutation({
    mutationFn: feedService.createPost,
    onSuccess: (newPost) => {
      queryClient.setQueryData<Post[]>(['feed', feedSort, feedCulture], (old = []) => [newPost, ...old]);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return {
    posts,
    isLoading,
    error,
    likePost: likePost.mutate,
    createPost: createPost.mutate,
    isCreating: createPost.isPending,
  };
}
