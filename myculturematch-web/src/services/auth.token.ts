/**
 * Token de session en mémoire uniquement.
 *
 * Le cookie HttpOnly posé par le backend est la vraie source d'authentification.
 * Le token n'est plus persisté dans localStorage : un XSS ne peut pas le voler
 * durablement, il disparaît à la fermeture/rechargement de la page.
 * Au rechargement, `authService.restoreSession()` le récupère via /api/auth/session.
 */
let token: string | null = null;

export function getAuthToken(): string | null {
  return token;
}

export function setAuthToken(value: string): void {
  token = value;
}

export function clearAuthToken(): void {
  token = null;
}
