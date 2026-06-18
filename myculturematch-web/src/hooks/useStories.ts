import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storiesService } from '@/src/services/storiesService';
import type { Story } from '@/src/types/story';

export function useStories() {
  const queryClient = useQueryClient();

  const { data: stories = [], isLoading, error } = useQuery<Story[]>({
    queryKey: ['stories'],
    queryFn: storiesService.getStories,
    staleTime: 1000 * 60 * 5,
  });

  const addStory = useMutation({
    mutationFn: storiesService.addStory,
    onSuccess: (newStory) => {
      queryClient.setQueryData<Story[]>(['stories'], (old = []) => [...old, newStory]);
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });

  return {
    stories,
    isLoading,
    error,
    addStory: addStory.mutate,
    isAdding: addStory.isPending,
  };
}
