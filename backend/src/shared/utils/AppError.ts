/** Erreur applicative avec statut HTTP et code métier stable. */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details?: unknown) {
    return new AppError(400, code, message, details);
  }
  static unauthorized(message = 'Non authentifié', code = 'UNAUTHORIZED') {
    return new AppError(401, code, message);
  }
  static forbidden(message = 'Accès refusé', code = 'FORBIDDEN') {
    return new AppError(403, code, message);
  }
  static notFound(message = 'Ressource introuvable', code = 'NOT_FOUND') {
    return new AppError(404, code, message);
  }
  static conflict(message: string, code = 'CONFLICT', details?: unknown) {
    return new AppError(409, code, message, details);
  }
  static tooMany(message = 'Trop de requêtes', code = 'RATE_LIMITED') {
    return new AppError(429, code, message);
  }
}
