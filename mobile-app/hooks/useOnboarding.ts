import { useState } from 'react';

export type OnboardingData = {
  intention: string;
  gender: string;
  seeking: string;
  name: string;
  photo: string | null;
  roots: { country: string; region: string; village: string };
  age: number;
  seekAge: [number, number];
  occupation: { domain: string; title: string };
  values: string[];
  languages: string[];
  preference: string;
  diaspora: string;
  familyQuiz: string;
  situation: string;
  criteria: string[];
  bio: string;
};

export const useOnboarding = (initialStep = 1) => {
  const [step, setStep] = useState(initialStep);
  const [formData, setFormData] = useState<OnboardingData>({
    intention: '',
    gender: '',
    seeking: '',
    name: '',
    photo: null,
    roots: { country: '', region: '', village: '' },
    age: 28,
    seekAge: [22, 35],
    occupation: { domain: '', title: '' },
    values: [],
    languages: [],
    preference: '',
    diaspora: '',
    familyQuiz: '',
    situation: '',
    criteria: [],
    bio: ''
  });

  const next = () => setStep(s => Math.min(s + 1, 15)); // Updated to 15 steps
  const back = () => setStep(s => Math.max(s - 1, 1));

  const updateField = (field: keyof OnboardingData, value: any) => {
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

  return { step, formData, next, back, updateField, toggleList };
};
