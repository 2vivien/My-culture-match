import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface TwoFactorRowProps {
  twoFactor: boolean;
  setTwoFactor: (val: boolean) => void;
}

export const TwoFactorRow: React.FC<TwoFactorRowProps> = ({ twoFactor, setTwoFactor }) => {
  return (
    <div className="py-5 flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-app-gray dark:text-zinc-400" />
        </div>
        <div>
          <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-200 leading-snug">
            Two-factor authentication
          </h4>
          <p className="text-xs text-app-gray dark:text-zinc-400 leading-snug mt-0.5">
            Add an extra layer of security to safeguard your ceremonial contributions
          </p>
        </div>
      </div>

      <button
        onClick={() => setTwoFactor(!twoFactor)}
        className={cn(
          "w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer flex items-center shrink-0",
          twoFactor ? "bg-[#E27D60]" : "bg-zinc-200 dark:bg-zinc-800"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
            twoFactor ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
};
