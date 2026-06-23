import React from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword?: string;
  setConfirmPassword?: (password: string) => void;
  showPassword?: boolean;
  setShowPassword?: (show: boolean) => void;
  rememberMe?: boolean;
  setRememberMe?: (rem: boolean) => void;
  isLoading?: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword = '',
  setConfirmPassword = () => {},
  showPassword = false,
  setShowPassword = () => {},
  rememberMe = false,
  setRememberMe = () => {},
  isLoading = false,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Email Field */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
          Adresse Email
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
            <Mail className="w-5 h-5" />
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors placeholder:text-zinc-400"
            required
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Mot de passe
          </label>
          {mode === 'signin' && (
            <a href="#" className="text-xs font-bold text-primary hover:underline">
              Mot de passe oublié ?
            </a>
          )}
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
            <Lock className="w-5 h-5" />
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-12 pr-12 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors placeholder:text-zinc-400"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Confirm Password Field (Sign Up Only) */}
      {mode === 'signup' && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
              <Lock className="w-5 h-5" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-12 pr-12 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-primary dark:focus:border-primary rounded-2xl outline-none text-zinc-900 dark:text-white text-base transition-colors placeholder:text-zinc-400"
              required
            />
          </div>
        </div>
      )}

      {/* Remember me (Sign In Only) */}
      {mode === 'signin' && (
        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary accent-primary"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-600 dark:text-zinc-400 font-medium select-none">
            Se souvenir de moi
          </label>
        </div>
      )}

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
            <span>{mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
};
