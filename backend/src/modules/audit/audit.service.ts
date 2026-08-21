import { db, schema } from '../../infrastructure/database';

export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Enregistre une entrée d'audit (changement d'email, 2FA, paramètres sensibles…).
 * Les logs d'audit sont immuables et conservés à des fins de traçabilité.
 */
export async function recordAudit(
  userId: string,
  action: string,
  metadata: Record<string, unknown> = {},
  context: AuditContext = {},
): Promise<void> {
  await db.insert(schema.auditLogs).values({
    userId,
    action,
    metadata,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  });
}
