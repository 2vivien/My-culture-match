import { useState, useEffect } from 'react';
import { createTribeService } from '@/src/services/createTribeService';
import type { TribeTopic, TribeType, TribeSubmission } from '@/src/types/createTribe';
import { useUIStore } from '@/src/stores/useUIStore';

export function useCreateTribe() {
  const { showCreateTribeModal, setShowCreateTribeModal } = useUIStore();
  const [createStep, setCreateStep] = useState(1);
  const [topics, setTopics] = useState<TribeTopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [tribeType, setTribeType] = useState<TribeType>('public');
  const [tribeName, setTribeName] = useState('');
  const [tribeDescription, setTribeDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    createTribeService.getTopics().then((data) => {
      if (isMounted) {
        setTopics(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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
    // Reset state after animation finishes
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
