import React from 'react';
import { cn } from '@/src/lib/utils';

interface ConnectionRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isConnected: boolean;
  onToggle: () => void;
}

export const ConnectionRow: React.FC<ConnectionRowProps> = ({
  icon,
  title,
  description,
  isConnected,
  onToggle,
}) => {
  return (
    <div className="py-5 flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="font-extrabold text-xs text-app-black dark:text-zinc-200 leading-snug">
            {title}
          </h4>
          <p className="text-[10.5px] text-app-gray dark:text-zinc-400 leading-snug mt-0.5">
            {description}
          </p>
        </div>
      </div>
      
      <button
        onClick={onToggle}
        className={cn(
          "px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer",
          isConnected 
            ? "border border-app-border hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-app-black dark:text-zinc-200" 
            : "bg-[#E27D60] hover:bg-[#c66b50] text-white"
        )}
      >
        {isConnected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
};
