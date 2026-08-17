import React, { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface TwoFactorFormProps {
  email: string;
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (code: string) => void;
  onBack: () => void;
}

export const TwoFactorForm: React.FC<TwoFactorFormProps> = ({
  email,
  isLoading = false,
  error = null,
  onSubmit,
  onBack,
}) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6 && !isLoading) onSubmit(code);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Double authentification active pour{' '}
          <span className="font-bold text-zinc-800 dark:text-zinc-200">{email}</span>.
          Saisissez le code à 6 chiffres de votre application d&apos;authentification.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="2fa-code"
          className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block"
        >
          Code d&apos;authentification
        </label>
        <input
          id="2fa-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          aria-invalid={!!error}
          className={cn(
            'w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-900 border rounded-2xl outline-none text-zinc-900 dark:text-white text-center text-2xl font-black tracking-[0.5em] transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-600',
            error
              ? 'border-red-400 focus:border-red-500'
              : 'border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary'
          )}
        />
        {error && (
          <p className="text-xs font-bold text-red-500 mt-1" role="alert">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={code.length !== 6 || isLoading}
        className="w-full py-4 px-6 bg-primary text-white rounded-2xl font-bold hover:bg-opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-opacity-50 select-none shadow-md shadow-primary/10 cursor-pointer"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>Vérifier</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-zinc-400">
        <button
          type="button"
          onClick={onBack}
          className="font-bold text-primary hover:underline cursor-pointer"
        >
          Retour à la connexion
        </button>
      </p>
    </form>
  );
};
