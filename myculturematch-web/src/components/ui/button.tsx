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
            'bg-app-black text-white hover:bg-zinc-800 shadow-sm': variant === 'primary',
            'bg-[#FCFCFC] border border-app-border text-app-black hover:bg-white': variant === 'secondary',
            'border border-app-border bg-white text-app-black hover:bg-[#FCFCFC]': variant === 'outline',
            'hover:bg-[#FCFCFC] hover:text-app-black text-app-gray': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
            'bg-purple-50 text-purple-600 hover:bg-purple-100': variant === 'purple',
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
