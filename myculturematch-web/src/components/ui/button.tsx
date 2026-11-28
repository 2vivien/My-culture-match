import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'framer-motion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'purple';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <motion.button
        whileTap={{ scale: 0.96 }}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-full cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none',
          {
            'bg-[#8B4A2B] text-white hover:bg-[#6F3A22] shadow-sm': variant === 'primary',
            'bg-[#FCFCFC] dark:bg-zinc-800 border border-app-border text-app-black dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700': variant === 'secondary',
            'border border-app-border bg-white dark:bg-zinc-900 text-app-black dark:text-zinc-100 hover:bg-[#FCFCFC] dark:hover:bg-zinc-800': variant === 'outline',
            'hover:bg-[#FCFCFC] dark:hover:bg-zinc-800 hover:text-app-black dark:hover:text-white text-app-gray': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
            'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-transparent dark:border-purple-900': variant === 'purple',
          },
          {
            'px-4 py-1.5 text-xs': size === 'sm',
            'px-6 py-2.5 text-sm': size === 'md',
            'px-8 py-3.5 text-base': size === 'lg',
            'w-12 h-12 flex items-center justify-center p-0 shrink-0': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
