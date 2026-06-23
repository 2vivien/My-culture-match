import React, { useState } from 'react';
import { useAppStore } from '@/src/stores/useAppStore';
import { Mail, Lock, Eye, EyeOff, User, Sparkles, Globe, Compass, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import authIllustration from '@/assets/auth_illustration.jpg';
import logoMyCultureMatch from '@/assets/logo-myculturematch.png';

export function AuthPage() {
  const { loginUser, setAuthenticated, setOnboarded } = useAppStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    // Mock API request delay
    setTimeout(() => {
      setIsLoading(false);
      if (mode === 'signin') {
        // Direct login to dashboard with default user
        loginUser({
          name: 'Amal',
          avatar: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Amal',
          location: 'Bénin',
        });
      } else {
        // Go to onboarding
        setAuthenticated(true);
        setOnboarded(false);
      }
    }, 1200);
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white dark:bg-zinc-950">
      {/* Left side: Premium Image and Branding (hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 h-full relative overflow-hidden bg-zinc-900">
        <img
          src={authIllustration}
          alt="MyCultureMatch Illustration"
          className="absolute inset-0 w-full h-full object-cover opacity-85 select-none"
        />
        
        {/* Warm Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/25 to-transparent mix-blend-color-burn" />

        {/* Branding Info */}
        <div className="absolute bottom-16 left-16 right-16 text-white z-10 flex flex-col gap-6">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 w-fit">
            <Globe className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-sm font-semibold tracking-wide">Rencontres & Héritage Culturel</span>
          </div>
          <div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              MyCulture<span className="text-primary font-bold">Match</span>
            </h1>
            <p className="text-lg text-zinc-200 mt-3 font-medium max-w-lg leading-relaxed">
              Reliez vos racines, partagez vos histoires ancestrales, et trouvez les compagnons qui font vibrer votre héritage.
            </p>
          </div>

          <div className="flex gap-8 border-t border-white/10 pt-6 mt-2">
            <div>
              <div className="text-2xl font-black text-primary">100%</div>
              <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">Héritage authentique</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">15+</div>
              <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">Critères culturels</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">Trio</div>
              <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">Recommandations hebdos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login / Register Form */}
      <div className="w-full md:w-1/2 lg:w-2/5 h-full flex flex-col px-6 sm:px-12 lg:px-16 overflow-y-auto bg-[#FEFEFE] dark:bg-zinc-950 py-12">
        <div className="max-w-md w-full mx-auto my-auto">
          
          {/* Logo or Icon */}
          <div className="flex items-center gap-3 mb-8 select-none">
            <img src={logoMyCultureMatch} alt="MyCultureMatch Logo" className="w-10 h-10 object-contain rounded-xl" />
            <span className="font-extrabold text-xl dark:text-white">MyCultureMatch</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              {mode === 'signin' ? 'Heureux de vous revoir' : 'Rejoignez la communauté'}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
              {mode === 'signin'
                ? 'Entrez vos identifiants pour accéder à vos compagnons et traditions.'
                : 'Commencez votre voyage d’exploration culturelle en créant votre compte.'}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl mb-8 border border-zinc-200/40 dark:border-zinc-800/40">
            <button
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className={`flex-1 py-3 text-center text-sm font-bold rounded-xl transition-all duration-200 ${
                mode === 'signin'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`flex-1 py-3 text-center text-sm font-bold rounded-xl transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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
                <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-600 dark:text-zinc-400 font-medium">
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

          {/* Social login option to look premium */}
          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute border-t border-zinc-200 dark:border-zinc-800 w-full" />
              <span className="relative bg-white dark:bg-zinc-950 px-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Ou continuer avec
              </span>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                className="flex-1 py-3 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors font-bold text-sm text-zinc-700 dark:text-zinc-300"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex-1 py-3 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors font-bold text-sm text-zinc-700 dark:text-zinc-300"
              >
                <svg className="w-5 h-5 text-black dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
                </svg>
                Apple
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-zinc-500">
            En continuant, vous acceptez les{' '}
            <a href="#" className="font-semibold text-zinc-700 dark:text-zinc-300 hover:underline">
              Conditions d’Utilisation
            </a>{' '}
            et la{' '}
            <a href="#" className="font-semibold text-zinc-700 dark:text-zinc-300 hover:underline">
              Politique de Confidentialité
            </a>{' '}
            de MyCultureMatch.
          </div>
        </div>
      </div>
    </div>
  );
}
