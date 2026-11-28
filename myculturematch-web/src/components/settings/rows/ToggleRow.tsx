import React from 'react';
import { cn } from '@/src/lib/utils';

interface ToggleRowProps {
  title: string;
  description: string;
  isActive: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({
  title,
  description,
  isActive,
  onToggle,
  disabled = false,
}) => {
  return (
    <div className="py-4.5 flex items-center justify-between gap-4">
      <div>
        <h4 className="font-extrabold text-sm text-app-black dark:text-zinc-200">{title}</h4>
        <p className="text-xs text-app-gray dark:text-zinc-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          "w-11 h-6 rounded-full transition-colors relative focus:outline-none flex items-center shrink-0",
          disabled 
            ? "cursor-not-allowed bg-zinc-400 dark:bg-zinc-600 opacity-70"
            : cn("cursor-pointer", isActive ? "bg-zinc-800 dark:bg-zinc-700" : "bg-zinc-200 dark:bg-zinc-800")
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
            isActive ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
};
