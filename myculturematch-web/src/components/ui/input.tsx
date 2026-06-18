import * as React from 'react';
import { cn } from '@/src/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', icon, ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center">
        {icon && (
          <div className="absolute left-4 text-app-gray flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'w-full bg-white text-app-black placeholder-app-gray border border-app-border rounded-full py-3 px-6 shadow-sm focus:border-app-black focus:ring-1 focus:ring-app-black transition-all outline-none text-sm',
            icon && 'pl-11',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
