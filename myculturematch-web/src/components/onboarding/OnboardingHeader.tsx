import React from 'react';
import logoMyCultureMatch from '@/assets/logo-myculturematch.png';

interface OnboardingHeaderProps {
  step: number;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ step }) => {
  return (
    <div className="w-full max-w-xl mx-auto flex justify-between items-center z-10 mb-8 select-none">
      <div className="flex items-center gap-2">
        <img src={logoMyCultureMatch} alt="MyCultureMatch Logo" className="w-6 h-6 object-contain rounded-md" />
        <span className="font-extrabold text-sm dark:text-white text-zinc-800">MyCultureMatch</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-extrabold text-sm text-zinc-400">Étape {step} sur 15</span>
        <div className="h-2 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 15) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
