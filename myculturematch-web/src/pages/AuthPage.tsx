import React, { useState } from 'react';
import { useAppStore } from '@/src/stores/useAppStore';
import { AuthIllustration } from '@/src/components/auth/AuthIllustration';
import { AuthHeader } from '@/src/components/auth/AuthHeader';
import { AuthForm } from '@/src/components/auth/AuthForm';
import { AuthSocialButtons } from '@/src/components/auth/AuthSocialButtons';
import { AuthFooter } from '@/src/components/auth/AuthFooter';
import { OtpForm } from '@/src/components/auth/OtpForm';
import { authService } from '@/src/services/authService';
import { USE_MOCK } from '@/src/services/api';

export function AuthPage() {
  const { setAuthenticated, setOnboarded, setEmail, loginUser } = useAppStore();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmailValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleContinue = async (value: string) => {
    setEmail(value);
    setEmailValue(value);
    setAuthError(null);

    if (USE_MOCK) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setAuthenticated(true);
        setOnboarded(false);
      }, 600);
      return;
    }

    setIsLoading(true);
    try {
      await authService.sendOtp(value);
      setStep('otp');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    if (USE_MOCK) return;
    setIsLoading(true);
    setAuthError(null);
    try {
      const { user, isNewUser } = await authService.verifyOtp(email, code);
      loginUser({
        id: user.id,
        name: user.name ?? email,
        avatar: user.avatar ?? undefined,
      });
      setAuthenticated(true);
      setOnboarded(!isNewUser);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Code invalide. Réessayez.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (USE_MOCK) return;
    setAuthError(null);
    try {
      await authService.sendOtp(email);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Impossible de renvoyer le code.');
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white dark:bg-zinc-950">
      {/* Left side Illustration & Branding */}
      <AuthIllustration />

      {/* Right side: email + continue / OTP verification */}
      <div className="w-full md:w-1/2 lg:w-2/5 h-full flex flex-col px-6 sm:px-12 lg:px-16 overflow-y-auto bg-[#FEFEFE] dark:bg-zinc-950 py-12">
        <div className="max-w-md w-full mx-auto my-auto">
          <AuthHeader />

          {step === 'email' ? (
            <AuthForm isLoading={isLoading} onSubmit={handleContinue} />
          ) : (
            <OtpForm
              email={email}
              isLoading={isLoading}
              error={authError}
              onSubmit={handleVerify}
              onResend={handleResend}
            />
          )}

          {step === 'email' && (
            <>
              <AuthSocialButtons />
              <AuthFooter />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
