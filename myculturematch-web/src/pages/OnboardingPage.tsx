import React from 'react';
import { OnboardingStepTerms } from '@/src/components/onboarding/OnboardingStepTerms';
import { OnboardingHeader } from '@/src/components/onboarding/OnboardingHeader';
import { OnboardingFooter } from '@/src/components/onboarding/OnboardingFooter';
import { StepIdentity } from '@/src/components/onboarding/steps/StepIdentity';
import { StepGender } from '@/src/components/onboarding/steps/StepGender';
import { StepBirthdate } from '@/src/components/onboarding/steps/StepBirthdate';
import { StepRoots } from '@/src/components/onboarding/steps/StepRoots';
import { StepLanguages } from '@/src/components/onboarding/steps/StepLanguages';
import { StepIntention } from '@/src/components/onboarding/steps/StepIntention';
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
    isStepValid,
    isSubmitting,
    submitError,
  } = useOnboarding();

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-zinc-50 dark:bg-[#0d1117]/80 relative overflow-hidden py-12 px-4 sm:px-6">
      <OnboardingStepTerms acceptedTerms={acceptedTerms} checkedTermsCheckbox={checkedTermsCheckbox} setCheckedTermsCheckbox={setCheckedTermsCheckbox} setAcceptedTerms={setAcceptedTerms} />

      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <OnboardingHeader step={step} />

      {/* Main Card Wrapper */}
      <div className="flex-1 w-full max-w-xl mx-auto flex items-center justify-center z-20 mb-8 animate-all">
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-6 sm:p-10 rounded-3xl shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {step === 1 && (
                <StepIdentity
                  name={formData.name}
                  username={formData.username}
                  usernameSuggestions={usernameSuggestions}
                  setName={(val) => updateField('name', val)}
                  setUsername={(val) => updateField('username', val)}
                />
              )}
              {step === 2 && (
                <StepGender
                  gender={formData.gender}
                  seeking={formData.seeking}
                  updateField={updateField}
                />
              )}
              {step === 3 && (
                <StepBirthdate
                  birthdate={formData.birthdate}
                  age={formData.age}
                  updateField={updateField}
                />
              )}
              {step === 4 && (
                <StepRoots
                  country={formData.roots.country}
                  region={formData.roots.region}
                  ethnicity={formData.roots.ethnicity}
                  village={formData.roots.village}
                  updateRoots={(roots) => updateField('roots', roots)}
                />
              )}
              {step === 5 && (
                <StepLanguages languages={formData.languages} toggleList={toggleList} />
              )}
              {step === 6 && (
                <StepIntention intention={formData.intention} updateField={updateField} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <OnboardingFooter step={step} handleBack={handleBack} handleNext={handleNext} isStepValid={isStepValid} isSubmitting={isSubmitting} />
      {submitError && (
        <p className="w-full max-w-xl mx-auto mt-4 text-center text-xs font-bold text-red-500" role="alert">
          {submitError}
        </p>
      )}
    </div>
  );
}
