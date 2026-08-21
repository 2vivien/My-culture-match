import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createTribeService } from '@/src/services/createTribeService';
import type { TribeTopic, TribeType, TribeSubmission } from '@/src/types/createTribe';
import { useUIStore } from '@/src/stores/useUIStore';

export function useCreateTribe() {
  const { showCreateTribeModal, setShowCreateTribeModal } = useUIStore();
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
      setCreateStep(4);
    } catch (err) {
      console.error('Error submitting tribe creation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowCreateTribeModal(false);
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
