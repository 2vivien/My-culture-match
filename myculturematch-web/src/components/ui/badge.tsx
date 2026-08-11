import React from 'react';
import { cn } from '@/src/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'red' | 'blue' | 'purple' | 'gray';
  className?: string;
}

export const Badge = ({ children, variant = 'default', className }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold select-none',
        {
          'bg-app-black text-white': variant === 'default',
          'border border-app-border bg-white dark:bg-zinc-900 text-app-black dark:text-zinc-100': variant === 'outline',
          'bg-[#E27D60] text-white shadow-sm': variant === 'red' || variant === 'blue',
          'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900': variant === 'purple',
          'bg-gray-100 dark:bg-zinc-800 text-app-black dark:text-zinc-100': variant === 'gray',
        },
        className
      )}
    >
      {children}
    </span>
  );
};
