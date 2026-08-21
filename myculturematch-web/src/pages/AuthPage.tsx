import React, { useState } from 'react';
import { useAppStore } from '@/src/stores/useAppStore';
import { AuthIllustration } from '@/src/components/auth/AuthIllustration';
import { AuthHeader } from '@/src/components/auth/AuthHeader';
import { AuthForm } from '@/src/components/auth/AuthForm';
import { AuthSocialButtons } from '@/src/components/auth/AuthSocialButtons';
import { AuthFooter } from '@/src/components/auth/AuthFooter';
import { OtpForm } from '@/src/components/auth/OtpForm';
import { TwoFactorForm } from '@/src/components/auth/TwoFactorForm';
import { authService } from '@/src/services/authService';
import { USE_MOCK } from '@/src/services/api';

export function AuthPage() {
  const { setAuthenticated, setOnboarded, setEmail, loginUser } = useAppStore();
  const [step, setStep] = useState<'email' | 'otp' | '2fa'>('email');
  const [email, setEmailValue] = useState('');
  const [ticket, setTicket] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleContinue = async (value: string) => {
    setEmail(value);
    setEmailValue(value);
    setAuthError(null);

    console.log('[Auth] handleContinue called:', { value, USE_MOCK });

    setIsLoading(true);

    if (USE_MOCK) {
      console.log('[Auth] MOCK MODE — sending OTP');
      try {
        await authService.sendOtp(value);
        setStep('otp');
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du code.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      console.log('[Auth] Calling sendOtp...');
      const result = await authService.sendOtp(value);
      console.log('[Auth] sendOtp success:', result);
      setStep('otp');
    } catch (err) {
      console.error('[Auth] sendOtp error:', err);
      setAuthError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du code.');
    } finally {
      setIsLoading(false);
    }
  };

  const finishLogin = (user: { id: string; name: string | null; avatar: string | null }, isNewUser: boolean) => {
    loginUser({
      id: user.id,
      name: user.name ?? email,
      avatar: user.avatar ?? undefined,
    });
    setAuthenticated(true);
    setOnboarded(!isNewUser);
  };

  const handleVerify = async (code: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await authService.verifyOtp(email, code);
      if ('twoFactorRequired' in result) {
        setTicket(result.ticket);
        setStep('2fa');
        return;
      }
      finishLogin(result.user, result.isNewUser);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Code invalide. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactor = async (code: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await authService.verifyTwoFactor(ticket, code);
      finishLogin(result.user, result.isNewUser);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Code de double authentification invalide.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('[Auth] Google login clicked');
    setIsLoading(true);
    setAuthError(null);

    try {
      if (USE_MOCK) {
        // Mock Google login — simulate a Google user
        console.log('[Auth] MOCK Google login');
        const mockGoogleUser = {
          id: 'user-google-mock',
          name: 'Google User',
          avatar: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=GoogleUser',
        };
        loginUser(mockGoogleUser);
        setAuthenticated(true);
        setOnboarded(false);
        setIsLoading(false);
        return;
      }

      // Real Google OAuth flow
      // @ts-expect-error - Google Identity Services API
      const google = window.google;
      if (!google?.accounts?.id) {
        setAuthError('Google Sign-In n\'est pas disponible. Vérifiez la connexion internet.');
        setIsLoading(false);
        return;
      }

      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
        callback: async (response: { credential: string }) => {
          setIsLoading(true);
          try {
            const result = await authService.loginWithGoogle(response.credential);
            if ('twoFactorRequired' in result) {
              setTicket(result.ticket);
              setStep('2fa');
            } else {
              finishLogin(result.user, result.isNewUser);
            }
          } catch (err) {
            setAuthError(err instanceof Error ? err.message : 'Erreur connexion Google.');
          } finally {
            setIsLoading(false);
          }
        },
      });
      google.accounts.id.prompt();
    } catch {
      setAuthError('Impossible de démarrer Google Sign-In.');
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    console.log('[Auth] Apple login clicked');
    setIsLoading(true);
    setAuthError(null);

    try {
      if (USE_MOCK) {
        console.log('[Auth] MOCK Apple login');
        const mockAppleUser = {
          id: 'user-apple-mock',
          name: 'Apple User',
          avatar: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=AppleUser',
        };
        loginUser(mockAppleUser);
        setAuthenticated(true);
        setOnboarded(false);
        setIsLoading(false);
        return;
      }

      setAuthError('Connexion Apple pas encore disponible.');
      setIsLoading(false);
    } catch {
      setAuthError('Connexion Apple pas encore disponible.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
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

      {/* Right side: email + continue / OTP verification / 2FA */}
      <div className="w-full md:w-1/2 lg:w-2/5 h-full flex flex-col px-6 sm:px-12 lg:px-16 overflow-y-auto bg-[#FEFEFE] dark:bg-zinc-950 py-12">
        <div className="max-w-md w-full mx-auto my-auto">
          <AuthHeader />

          {step === 'email' ? (
            <AuthForm isLoading={isLoading} error={authError} onSubmit={handleContinue} />
          ) : step === 'otp' ? (
            <OtpForm
              email={email}
              isLoading={isLoading}
              error={authError}
              onSubmit={handleVerify}
              onResend={handleResend}
            />
          ) : (
            <TwoFactorForm
              email={email}
              isLoading={isLoading}
              error={authError}
              onSubmit={handleTwoFactor}
              onBack={() => {
                setStep('otp');
                setAuthError(null);
              }}
            />
          )}

          {step === 'email' && (
            <>
              <AuthSocialButtons onGoogle={handleGoogleLogin} onApple={handleAppleLogin} isLoading={isLoading} />
              <AuthFooter />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
