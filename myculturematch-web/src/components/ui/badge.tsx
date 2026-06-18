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
          'border border-app-border bg-white text-app-black': variant === 'outline',
          'bg-red-500 text-white shadow-sm': variant === 'red',
          'bg-blue-600 text-white shadow-sm': variant === 'blue',
          'bg-purple-50 text-purple-600 border border-purple-100': variant === 'purple',
          'bg-gray-100 text-app-black': variant === 'gray',
        },
        className
      )}
    >
      {children}
    </span>
  );
};
