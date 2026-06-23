import React from 'react';
import { OnboardingStepTerms } from '@/src/components/onboarding/OnboardingStepTerms';
import { OnboardingHeader } from '@/src/components/onboarding/OnboardingHeader';
import { OnboardingFooter } from '@/src/components/onboarding/OnboardingFooter';
import { StepsBasicInfo } from '@/src/components/onboarding/steps/StepsBasicInfo';
import { StepsRootsOccupation } from '@/src/components/onboarding/steps/StepsRootsOccupation';
import { StepsPreferences } from '@/src/components/onboarding/steps/StepsPreferences';
import { StepsDetailsRecap } from '@/src/components/onboarding/steps/StepsDetailsRecap';
import { useOnboarding } from '@/src/hooks/useOnboarding';
import { AnimatePresence, motion } from 'framer-motion';

export function OnboardingPage() {
  const {
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
  } = useOnboarding();

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-zinc-50 dark:bg-zinc-955/80 relative overflow-hidden py-12 px-4 sm:px-6">
      <OnboardingStepTerms acceptedTerms={acceptedTerms} checkedTermsCheckbox={checkedTermsCheckbox} setCheckedTermsCheckbox={setCheckedTermsCheckbox} setAcceptedTerms={setAcceptedTerms} />

      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <OnboardingHeader step={step} />

      {/* Main Card Wrapper */}
      <div className="flex-1 w-full max-w-xl mx-auto flex items-center justify-center z-10 mb-8 animate-all">
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 sm:p-10 rounded-3xl shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {step <= 3 && (
                <StepsBasicInfo
                  step={step} intention={formData.intention} gender={formData.gender} seeking={formData.seeking}
                  name={formData.name} username={formData.username} avatarSeed={formData.avatarSeed}
                  usernameSuggestions={usernameSuggestions} setName={(val) => updateField('name', val)}
                  setUsername={(val) => updateField('username', val)} shuffleAvatar={shuffleAvatar} updateField={updateField}
                />
              )}
              {step >= 4 && step <= 6 && (
                <StepsRootsOccupation
                  step={step} roots={formData.roots} birthdate={formData.birthdate} age={formData.age}
                  occupation={formData.occupation} updateField={updateField} updateRoots={(roots) => updateField('roots', roots)}
                />
              )}
              {step >= 7 && step <= 10 && (
                <StepsPreferences
                  step={step} values={formData.values} languages={formData.languages} preference={formData.preference}
                  diaspora={formData.diaspora} updateField={updateField} toggleList={toggleList}
                />
              )}
              {step >= 11 && (
                <StepsDetailsRecap
                  step={step} familyQuiz={formData.familyQuiz} situation={formData.situation} criteria={formData.criteria}
                  bio={formData.bio} name={formData.name} username={formData.username} avatarSeed={formData.avatarSeed}
                  roots={formData.roots} updateField={updateField} toggleList={toggleList}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <OnboardingFooter step={step} handleBack={handleBack} handleNext={handleNext} isStepValid={isStepValid} />
    </div>
  );
}
