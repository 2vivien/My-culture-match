import React from 'react';
import { cn } from '@/src/lib/utils';

interface CreateTribeFooterProps {
  step: number;
  onBack: () => void;
  onCancel: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onDone: () => void;
  selectedTopicsCount: number;
  tribeName: string;
  tribeDescription: string;
}

export const CreateTribeFooter: React.FC<CreateTribeFooterProps> = ({
  step,
  onBack,
  onCancel,
  onNext,
  onSubmit,
  onDone,
  selectedTopicsCount,
  tribeName,
  tribeDescription,
}) => {
  return (
    <div className="flex items-center justify-between pt-3 border-t border-app-border/40 dark:border-zinc-800/40 select-none">
      {/* Dots */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((stepNum) => (
          <div
            key={stepNum}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              step === stepNum
                ? "bg-[#E27D60] w-4"
                : "bg-zinc-200 dark:bg-zinc-800"
            )}
          />
        ))}
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        {step > 1 && step < 4 && (
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-app-black dark:text-zinc-300 text-xs font-black uppercase tracking-wider cursor-pointer transition-colors"
          >
            Back
          </button>
        )}
        {step === 1 && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-app-black dark:text-zinc-300 text-xs font-black uppercase tracking-wider cursor-pointer transition-colors"
          >
            Cancel
          </button>
        )}

        {step === 1 && (
          <button
            type="button"
            onClick={onNext}
            disabled={selectedTopicsCount === 0}
            className={cn(
              "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer transition-all select-none",
              selectedTopicsCount > 0
                ? "bg-[#E27D60] text-white hover:brightness-105"
                : "bg-zinc-100 dark:bg-zinc-900 text-app-gray/50 dark:text-zinc-700 cursor-not-allowed border border-app-border/40 dark:border-zinc-800"
            )}
          >
            Next
          </button>
        )}

        {step === 2 && (
          <button
            type="button"
            onClick={onNext}
            className="px-6 py-2.5 bg-[#E27D60] text-white hover:brightness-105 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer transition-all select-none"
          >
            Next
          </button>
        )}

        {step === 3 && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!tribeName.trim() || !tribeDescription.trim()}
            className={cn(
              "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer transition-all select-none",
              tribeName.trim() && tribeDescription.trim()
                ? "bg-[#E27D60] text-white hover:brightness-105"
                : "bg-zinc-100 dark:bg-zinc-900 text-app-gray/50 dark:text-zinc-700 cursor-not-allowed border border-app-border/40 dark:border-zinc-800"
            )}
          >
            Create Tribu
          </button>
        )}

        {step === 4 && (
          <button
            type="button"
            onClick={onDone}
            className="px-6 py-2.5 bg-[#E27D60] text-white hover:brightness-105 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer transition-all select-none"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};
