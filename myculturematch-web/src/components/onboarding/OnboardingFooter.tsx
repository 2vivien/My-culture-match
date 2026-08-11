import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OnboardingFooterProps {
  step: number;
  handleBack: () => void;
  handleNext: () => void;
  isStepValid: () => boolean;
  isSubmitting: boolean;
}

export const OnboardingFooter: React.FC<OnboardingFooterProps> = ({
  step,
  handleBack,
  handleNext,
  isStepValid,
  isSubmitting,
}) => {
  const isValid = isStepValid() && !isSubmitting;
  
  return (
    <div className="w-full max-w-xl mx-auto flex justify-between gap-4 z-10 select-none">
      <button
        type="button"
        onClick={handleBack}
        disabled={step === 1 || isSubmitting}
        className={`flex items-center gap-2 py-4 px-6 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 transition-all active:scale-[0.98] disabled:opacity-0 disabled:pointer-events-none ${step > 1 && !isSubmitting ? 'cursor-pointer' : ''}`}
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Retour</span>
      </button>

      <button
        type="button"
        onClick={handleNext}
        disabled={!isValid}
        className={`flex items-center gap-2 py-4 px-8 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-55 disabled:pointer-events-none ${isValid ? 'cursor-pointer hover:bg-opacity-95' : ''}`}
      >
        {isSubmitting ? (
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>{step === 6 ? 'Créer mon profil' : 'Continuer'}</span>
            <ChevronRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
};
