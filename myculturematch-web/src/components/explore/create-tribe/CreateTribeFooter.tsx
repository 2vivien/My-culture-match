import React from 'react';
import { cn } from '@/src/lib/utils';
import { useUIStore } from '@/src/stores/useUIStore';

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
  const tribeCreateError = useUIStore((s) => s.tribeCreateError);
  return (
    <div className="flex flex-col gap-2.5 pt-3 border-t border-app-border/40 dark:border-zinc-800/40 select-none">
      {tribeCreateError && (
        <p className="text-[11px] font-bold text-[#8B4A2B] bg-[#8B4A2B]/10 border border-[#8B4A2B]/25 rounded-xl px-3 py-2">
          {tribeCreateError}
        </p>
      )}
      <div className="flex items-center justify-between">
      {/* Dots */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((stepNum) => (
          <div
            key={stepNum}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              step === stepNum
                ? "bg-[#8B4A2B] w-4"
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
                ? "bg-[#8B4A2B] text-white hover:brightness-105"
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
            className="px-6 py-2.5 bg-[#8B4A2B] text-white hover:brightness-105 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer transition-all select-none"
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
                ? "bg-[#8B4A2B] text-white hover:brightness-105"
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
            className="px-6 py-2.5 bg-[#8B4A2B] text-white hover:brightness-105 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer transition-all select-none"
          >
            Done
          </button>
        )}
      </div>
      </div>
    </div>
  );
};
