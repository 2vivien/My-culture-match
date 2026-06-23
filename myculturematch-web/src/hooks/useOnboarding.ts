import { useState, useEffect } from 'react';
import { useAppStore } from '@/src/stores/useAppStore';
import { generateUsernameSuggestions, calculateAge } from '@/src/services/onboarding.service';

export interface OnboardingData {
  intention: string;
  gender: string;
  seeking: string;
  name: string;
  username: string;
  birthdate: string;
  age: number;
  avatarSeed: string;
  roots: { country: string; region: string; ethnicity: string; village: string };
  occupation: { domain: string; title: string };
  values: string[];
  languages: string[];
  preference: string;
  diaspora: string;
  familyQuiz: string;
  situation: string;
  criteria: string[];
  bio: string;
}

export function useOnboarding() {
  const { loginUser } = useAppStore();
  const [step, setStep] = useState(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [checkedTermsCheckbox, setCheckedTermsCheckbox] = useState(false);
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

  const updateField = (field: string, value: any) => {
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

  const handleNext = () => {
    if (step < 15) {
      setStep(step + 1);
    } else {
      const avatarUrl = `https://api.dicebear.com/7.x/open-peeps/svg?seed=${encodeURIComponent(formData.avatarSeed || formData.username || formData.name || 'default')}`;
      loginUser({
        name: formData.name || 'Anonyme',
        avatar: avatarUrl,
        location: formData.roots.country || 'Inconnu',
        tribes: [formData.roots.region, formData.roots.ethnicity].filter(Boolean),
      });
    }
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));
  const shuffleAvatar = () => updateField('avatarSeed', Math.random().toString(36).substring(7));

  const isStepValid = () => {
    switch (step) {
      case 1: return !!formData.intention;
      case 2: return !!formData.gender && !!formData.seeking;
      case 3: return !!formData.name.trim() && !!formData.username.trim();
      case 4: return !!formData.roots.country.trim() && !!formData.roots.region.trim() && !!formData.roots.ethnicity.trim();
      case 5: return !!formData.birthdate && formData.age >= 18;
      case 6: return !!formData.occupation.domain;
      case 7: return formData.values.length > 0;
      case 8: return formData.languages.length > 0;
      case 9: return !!formData.preference;
      case 10: return !!formData.diaspora;
      case 11: return !!formData.familyQuiz;
      case 12: return !!formData.situation;
      case 13: return formData.criteria.length > 0;
      case 14: return formData.bio.trim().length >= 10;
      default: return true;
    }
  };

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
    shuffleAvatar,
    isStepValid,
  };
}
