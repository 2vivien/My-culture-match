import React from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emailSchema, type EmailFormValues } from '@/src/lib/validations';
import { cn } from '@/src/lib/utils';

interface AuthFormProps {
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (email: string) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ isLoading = false, error = null, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    mode: 'onBlur',
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values.email))} className="space-y-5" noValidate>
      {/* Email Field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block"
        >
          Adresse Email
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
            <Mail className="w-5 h-5" />
          </span>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            aria-invalid={!!errors.email}
            className={cn(
              'w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900 border rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors placeholder:text-zinc-400',
              errors.email
                ? 'border-red-400 focus:border-red-500'
                : 'border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary'
            )}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="text-xs font-bold text-red-500 mt-1" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 px-6 bg-primary text-white rounded-2xl font-bold hover:bg-opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-opacity-50 select-none shadow-md shadow-primary/10 cursor-pointer"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>Continuer</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      {error && (
        <p className="text-xs font-bold text-red-500 text-center mt-1" role="alert">
          {error}
        </p>
      )}
    </form>
  );
};
