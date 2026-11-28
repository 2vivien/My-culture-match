import { db } from '../../infrastructure/database';
import { userLocationSettings } from './location.schema';

/**
 * Crée la ligne de réglages de position (valeurs par défaut de la base : visibilité « friends ») si elle manque.
 * Sans elle, activer le partage laissait la personne sans réglages explicites. Idempotent, sans dépendance
 * vers location.service / users.service (qui l'importent tous les deux).
 */
export async function ensureLocationSettingsRow(userId: string): Promise<void> {
  await db.insert(userLocationSettings).values({ userId }).onConflictDoNothing({ target: userLocationSettings.userId });
}
