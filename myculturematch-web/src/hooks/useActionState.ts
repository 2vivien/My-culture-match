import { useCallback, useRef, useState } from 'react';
import { apiErrorMessage } from '@/src/lib/apiErrors';

/**
 * État « en cours / en erreur » par action nommée : empêche le double envoi, et garde un message français
 * (statuts 401/403/404/409/429 dédiés) à afficher près du bouton plutôt qu'une promesse rejetée non gérée.
 */
export function useActionState() {
  const inFlight = useRef(new Set<string>());
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const setError = useCallback((key: string, message: string | null) => {
    setErrors((cur) => (cur[key] === message ? cur : { ...cur, [key]: message }));
  }, []);

  /** Exécute `fn` ; retourne `true` si elle a réussi. Ignorée si la même action est déjà en cours. */
  const run = useCallback(
    async (key: string, fn: () => Promise<unknown>, fallback: string): Promise<boolean> => {
      if (inFlight.current.has(key)) return false;
      inFlight.current.add(key);
      setBusy((cur) => ({ ...cur, [key]: true }));
      setError(key, null);
      try {
        await fn();
        return true;
      } catch (err) {
        setError(key, apiErrorMessage(err, fallback));
        return false;
      } finally {
        inFlight.current.delete(key);
        setBusy((cur) => ({ ...cur, [key]: false }));
      }
    },
    [setError],
  );

  return { busy, errors, run, setError };
}
