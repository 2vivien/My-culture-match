import React, { useState } from 'react';
import { useAppStore } from '@/src/stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthIllustration } from '@/src/components/auth/AuthIllustration';
import { AuthHeader } from '@/src/components/auth/AuthHeader';
import { AuthModeSwitcher } from '@/src/components/auth/AuthModeSwitcher';
import { AuthForm } from '@/src/components/auth/AuthForm';
import { AuthSocialButtons } from '@/src/components/auth/AuthSocialButtons';
import { AuthFooter } from '@/src/components/auth/AuthFooter';

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
      {/* Left side Illustration & Branding */}
      <AuthIllustration />

      {/* Right side: Login / Register Form */}
      <div className="w-full md:w-1/2 lg:w-2/5 h-full flex flex-col px-6 sm:px-12 lg:px-16 overflow-y-auto bg-[#FEFEFE] dark:bg-zinc-950 py-12">
        <div className="max-w-md w-full mx-auto my-auto">
          <AuthHeader mode={mode} />
          
          <AuthModeSwitcher mode={mode} setMode={setMode} setError={setError} />

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

          <AuthForm
            mode={mode}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />

          <AuthSocialButtons />
          <AuthFooter />
        </div>
      </div>
    </div>
  );
}
