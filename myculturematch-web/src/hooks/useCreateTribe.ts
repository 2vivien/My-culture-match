import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createTribeService } from '@/src/services/createTribeService';
import type { TribeTopic, TribeType, TribeSubmission } from '@/src/types/createTribe';
import { useUIStore } from '@/src/stores/useUIStore';

export function useCreateTribe() {
  const { showCreateTribeModal, setShowCreateTribeModal } = useUIStore();
  const queryClient = useQueryClient();
  const [createStep, setCreateStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [tribeType, setTribeType] = useState<TribeType>('public');
  const [tribeName, setTribeName] = useState('');
  const [tribeDescription, setTribeDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: topics = [] } = useQuery<TribeTopic[]>({
    queryKey: ['tribe-topics'],
    queryFn: createTribeService.getTopics,
    staleTime: 1000 * 60 * 30,
  });

  const toggleTopic = (topicName: string) => {
    setSelectedTopics((prev) => {
      if (prev.includes(topicName)) {
        return prev.filter((t) => t !== topicName);
      }
      return [...prev, topicName];
    });
  };

  const nextStep = () => {
    setCreateStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCreateStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!tribeName.trim() || !tribeDescription.trim()) return;
    setIsSubmitting(true);
    const submission: TribeSubmission = {
      topics: selectedTopics,
      type: tribeType,
      name: tribeName,
      description: tribeDescription,
    };

    try {
      await createTribeService.submitTribe(submission);
      // Rafraîchit les listes de tribus : sidebar "Your Own Tribes" (['my-tribes']),
      // create tradition (['tribe-options']) et explore (['explore']).
      await queryClient.invalidateQueries({ queryKey: ['my-tribes'] });
      await queryClient.invalidateQueries({ queryKey: ['tribe-options'] });
      await queryClient.invalidateQueries({ queryKey: ['explore'] });
      useUIStore.setState({ tribeCreateError: null });
      setCreateStep(4);
    } catch (err) {
      console.error('Error submitting tribe creation:', err);
      const code = (err as { code?: string })?.code;
      const message =
        code === 'TRIBE_LIMIT_REACHED'
          ? 'You reached the maximum of 5 tribes.'
          : 'Name or tag already taken — try another name.';
      useUIStore.setState({ tribeCreateError: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowCreateTribeModal(false);
    useUIStore.setState({ tribeCreateError: null });
    setTimeout(() => {
      setCreateStep(1);
      setSelectedTopics([]);
      setTribeType('public');
      setTribeName('');
      setTribeDescription('');
    }, 300);
  };

  return {
    showCreateTribeModal,
    createStep,
    setCreateStep,
    topics,
    selectedTopics,
    toggleTopic,
    tribeType,
    setTribeType,
    tribeName,
    setTribeName,
    tribeDescription,
    setTribeDescription,
    isSubmitting,
    nextStep,
    prevStep,
    handleSubmit,
    closeModal,
  };
}
