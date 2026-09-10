import { useState } from 'react';
import { settingsService } from '@/src/services/settingsService';
import { ApiError } from '@/src/services/api';

type EmailChangeStep = 'idle' | 'awaiting-code';

/** Flux de changement d'email vérifié par OTP : demande de code puis confirmation. */
export function useEmailChange(onChanged: (email: string) => void) {
  const [step, setStep] = useState<EmailChangeStep>('idle');
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setStep('idle');
    setPendingEmail('');
    setError(null);
  };

  const requestCode = async (newEmail: string): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await settingsService.requestEmailChange(newEmail);
      setPendingEmail(newEmail);
      setStep('awaiting-code');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erreur inattendue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmCode = async (code: string): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await settingsService.confirmEmailChange(pendingEmail, code);
      onChanged(pendingEmail);
      reset();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erreur inattendue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { step, pendingEmail, error, isSubmitting, requestCode, confirmCode, cancel: reset };
}
