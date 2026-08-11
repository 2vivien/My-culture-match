import { useState, useEffect } from 'react';
import { useAppStore } from '@/src/stores/useAppStore';
import {
  generateUsernameSuggestions,
  calculateAge,
  submitProfile,
} from '@/src/services/onboarding.service';
import {
  validateStep,
  type OnboardingData,
  type UpdateField,
} from '@/src/lib/onboarding.schemas';

export function useOnboarding() {
  const { loginUser, email } = useAppStore();
  const [step, setStep] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [checkedTermsCheckbox, setCheckedTermsCheckbox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [formData, setFormData] = useState<OnboardingData>({
    intention: '', gender: '', seeking: '', name: '', username: '', birthdate: '', age: 0, avatarSeed: '',
    roots: { country: '', region: '', ethnicity: '', village: '' },
    occupation: { domain: '', title: '' },
    values: [], languages: [], preference: '', diaspora: '', familyQuiz: '', situation: '', criteria: [], bio: ''
  });

  useEffect(() => {
    if (formData.username && !formData.avatarSeed) {
      setFormData(prev => ({ ...prev, avatarSeed: prev.username }));
    } else if (formData.name && !formData.avatarSeed) {
      setFormData(prev => ({ ...prev, avatarSeed: prev.name }));
    }
  }, [formData.name, formData.username]);

  useEffect(() => {
    if (formData.name) {
      setUsernameSuggestions(generateUsernameSuggestions(formData.name));
    } else {
      setUsernameSuggestions([]);
    }
  }, [formData.name]);

  useEffect(() => {
    if (formData.birthdate) {
      const calculatedAge = calculateAge(formData.birthdate);
      setFormData(prev => {
        if (prev.age === calculatedAge) return prev;
        return { ...prev, age: calculatedAge };
      });
    }
  }, [formData.birthdate]);

  const updateField: UpdateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleList = (field: 'values' | 'languages' | 'criteria', item: string, max?: number) => {
    const list = [...formData[field]];
    if (list.includes(item)) {
      updateField(field, list.filter(i => i !== item));
    } else {
      if (max && list.length >= max) return;
      updateField(field, [...list, item]);
    }
  };

  const handleNext = async () => {
    if (step < 6) {
      setStep(step + 1);
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const avatarUrl = `https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(formData.avatarSeed || formData.username || formData.name || 'default')}`;
      await submitProfile({
        ...formData,
        email: email || undefined,
        acceptedTermsAt: acceptedTerms ? new Date().toISOString() : null,
      });
      loginUser({
        name: formData.name || 'Anonyme',
        avatar: avatarUrl,
        location: formData.roots.country || 'Inconnu',
        tribes: [formData.roots.region, formData.roots.ethnicity].filter(Boolean),
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const isStepValid = () => validateStep(step, formData);

  return {
    step,
    acceptedTerms,
    setAcceptedTerms,
    checkedTermsCheckbox,
    setCheckedTermsCheckbox,
    usernameSuggestions,
    formData,
    updateField,
    toggleList,
    handleNext,
    handleBack,
    isStepValid,
    isSubmitting,
    submitError,
  };
}
