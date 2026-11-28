import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/src/stores/useAppStore';
import { AuthIllustration } from '@/src/components/auth/AuthIllustration';
import { AuthHeader } from '@/src/components/auth/AuthHeader';
import { AuthForm } from '@/src/components/auth/AuthForm';
import { AuthSocialButtons } from '@/src/components/auth/AuthSocialButtons';
import { AuthFooter } from '@/src/components/auth/AuthFooter';
import { OtpForm } from '@/src/components/auth/OtpForm';
import { TwoFactorForm } from '@/src/components/auth/TwoFactorForm';
import { authService } from '@/src/services/authService';

interface AuthPageProps {
  /** `modal` = formulaire seul, sans l'illustration de gauche, dans la popup du home. */
  variant?: 'page' | 'modal';
  /** Appelé après une connexion réussie (fermeture de la popup). */
  onClose?: () => void;
}

export function AuthPage({ variant = 'page', onClose }: AuthPageProps) {
  const { setAuthenticated, setOnboarded, setEmail, loginUser } = useAppStore();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'email' | 'otp' | '2fa'>('email');
  const [email, setEmailValue] = useState('');
  const [ticket, setTicket] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleContinue = async (value: string) => {
    setEmail(value);
    setEmailValue(value);
    setAuthError(null);
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

  const finishLogin = (user: { id: string; name: string | null; username?: string | null; avatar: string | null; email?: string }, isNewUser: boolean) => {
    loginUser({
      id: user.id,
      name: user.name ?? email,
      username: user.username ?? email.split('@')[0] ?? 'user',
      avatar: user.avatar ?? undefined,
    });
    setEmail((user.email ?? email).trim());
    // Les requêtes faites en mode visiteur ont échoué en 401 : on vide leur cache
    // pour que le feed et les panneaux soient rechargés avec la session active.
    queryClient.clear();
    setAuthenticated(true);
    setOnboarded(!isNewUser);
    // La popup se referme dès que la session est établie : on retombe sur le home.
    onClose?.();
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
    setIsLoading(true);
    setAuthError(null);

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
      if (!clientId) {
        setAuthError('Google Sign-In non configuré (VITE_GOOGLE_CLIENT_ID manquant). Modifiez le .env puis redémarrez Vite.');
        setIsLoading(false);
        return;
      }

      // @ts-expect-error - Google Identity Services API
      const google = window.google;
      if (!google?.accounts?.id) {
        setAuthError('Google Sign-In n\'est pas disponible. Vérifiez la connexion internet.');
        setIsLoading(false);
        return;
      }

      const handleCredential = async (response: { credential: string }) => {
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
      };

      google.accounts.id.initialize({
        client_id: clientId,
        context: 'signin',
        auto_select: false,
        callback: handleCredential,
        error_callback: (error: { type?: string; message?: string }) => {
          // Ex. type "popup_failed_to_open" / "popup_closed" / "idp_iframe_error".
          // "Not signed in with the identity provider" / FedCM NetworkError = pas de session
          // Google dans ce navigateur → One Tap ne peut pas émettre de token.
          setAuthError(
            `Connexion Google refusée par Google (${error?.type ?? 'erreur'}). ` +
              'Si vous n\'êtes pas connecté à Google dans ce navigateur, connectez-vous d\'abord sur accounts.google.com puis réessayez. ' +
              `Vérifiez aussi que ${window.location.origin} est dans les “Authorized JavaScript origins” Google et autorisez les cookies tiers. ` +
              (error?.message ? `Détail : ${error.message}` : ''),
          );
          setIsLoading(false);
        },
      });
      // Migration FedCM : ne plus utiliser les moments "display" (isNotDisplayed /
      // getNotDisplayedReason) ni getSkippedReason() — Google les retire quand FedCM
      // devient obligatoire. Seuls isSkippedMoment / isDismissedMoment restent supportés.
      google.accounts.id.prompt((notification: {
        isSkippedMoment?: () => boolean;
        isDismissedMoment?: () => boolean;
      }) => {
        if (!notification) return;
        // Prompt fermé / ignoré par l'utilisateur : on débloque juste le bouton.
        if (typeof notification.isDismissedMoment === 'function' && notification.isDismissedMoment()) {
          setIsLoading(false);
          return;
        }
        // One Tap ignoré (ex. pas de session Google, FedCM /gsi/status 403) :
        // message actionnable au lieu d'un simple silence console.
        if (typeof notification.isSkippedMoment === 'function' && notification.isSkippedMoment()) {
          setAuthError(
            'Google n\'a pas pu démarrer la connexion — vous n\'êtes probablement pas connecté à Google dans ce navigateur. ' +
              `Connectez-vous sur accounts.google.com, puis retentez. Si ça persiste, vérifiez que ${window.location.origin} est autorisé dans Google Cloud Console.`,
          );
          setIsLoading(false);
        }
      });
    } catch {
      setAuthError('Impossible de démarrer Google Sign-In.');
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    setAuthError('Connexion Apple pas encore disponible.');
    setIsLoading(false);
  };

  const handleResend = async () => {
    setAuthError(null);
    try {
      await authService.sendOtp(email);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Impossible de renvoyer le code.');
    }
  };

  // Formulaire partagé entre la page d'authentification historique et la popup du home.
  const form = (
    <div className="max-w-md w-full mx-auto">
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
  );

  if (variant === 'modal') {
    // Pas de AuthIllustration ici : la popup reste compacte et centrée sur le home.
    return <div className="w-full">{form}</div>;
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white dark:bg-zinc-950">
      <AuthIllustration />

      <div className="w-full md:w-1/2 lg:w-2/5 h-full flex flex-col px-6 sm:px-12 lg:px-16 overflow-y-auto bg-[#FEFEFE] dark:bg-zinc-950 py-12">
        <div className="my-auto">{form}</div>
      </div>
    </div>
  );
}
