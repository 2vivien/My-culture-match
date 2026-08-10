import { randomUUID } from 'node:crypto';

/** Génère un identifiant UUID v4 (utilisé pour tous les IDs de la base). */
export function generateId(): string {
  return randomUUID();
}
