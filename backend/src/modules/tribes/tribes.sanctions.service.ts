import { and, eq, sql } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';
import { recordAudit } from '../audit/audit.service';
import { blocksMembership, blocksWriting, canSanction, expiryFromDays, isSanctionActive, type SanctionKind, type TribeRole } from './tribes.sanctions.policy';

async function roleOf(tribeId: string, userId: string): Promise<TribeRole | null> {
  const [row] = await db.select({ role: schema.tribeMembers.role }).from(schema.tribeMembers)
    .where(and(eq(schema.tribeMembers.tribeId, tribeId), eq(schema.tribeMembers.userId, userId))).limit(1);
  return row?.role ?? null;
}

/** Sanction active (non expirée) d'un utilisateur dans une tribu, sinon null. */
export async function getActiveSanction(tribeId: string, userId: string): Promise<{ kind: SanctionKind; reason: string | null; expiresAt: Date | null } | null> {
  const [row] = await db.select().from(schema.tribeSanctions)
    .where(and(eq(schema.tribeSanctions.tribeId, tribeId), eq(schema.tribeSanctions.userId, userId))).limit(1);
  if (!row || !isSanctionActive(row.expiresAt)) return null;
  return { kind: row.kind as SanctionKind, reason: row.reason, expiresAt: row.expiresAt };
}

/** Refuse l'écriture (post, commentaire) si l'utilisateur est banni ou muet dans la tribu. */
export async function assertCanWriteInTribe(tribeId: string, userId: string): Promise<void> {
  const sanction = await getActiveSanction(tribeId, userId);
  if (sanction && blocksWriting(sanction.kind)) {
    throw AppError.forbidden(sanction.kind === 'ban' ? 'Vous êtes banni de cette tribu' : 'Vous êtes réduit au silence dans cette tribu', 'TRIBE_SANCTIONED');
  }
}

/** Refuse l'adhésion si l'utilisateur est banni. */
export async function assertCanJoinTribe(tribeId: string, userId: string): Promise<void> {
  const sanction = await getActiveSanction(tribeId, userId);
  if (sanction && blocksMembership(sanction.kind)) throw AppError.forbidden('Vous êtes banni de cette tribu', 'TRIBE_BANNED');
}

export interface SanctionInput { userId: string; kind: SanctionKind; reason?: string; days?: number }

function requireModerator(role: TribeRole | null): void {
  if (role !== 'owner' && role !== 'moderator') throw AppError.forbidden('Réservé aux modérateurs de la tribu', 'TRIBE_MODERATOR_REQUIRED');
}

/** POST /api/tribes/:id/sanctions — modérateur+ (owner pour sanctionner un modérateur). */
export async function sanctionMember(tribeId: string, actorId: string, input: SanctionInput): Promise<{ userId: string; kind: SanctionKind; expiresAt: string | null }> {
  const actorRole = await roleOf(tribeId, actorId);
  requireModerator(actorRole);
  const targetRole = await roleOf(tribeId, input.userId);
  if (!canSanction(actorRole, targetRole, actorId, input.userId)) throw AppError.forbidden('Vous ne pouvez pas sanctionner cette personne', 'TRIBE_SANCTION_FORBIDDEN');

  const expiresAt = expiryFromDays(input.days);
  await db.insert(schema.tribeSanctions)
    .values({ tribeId, userId: input.userId, kind: input.kind, reason: input.reason ?? null, createdBy: actorId, expiresAt })
    .onConflictDoUpdate({
      target: [schema.tribeSanctions.tribeId, schema.tribeSanctions.userId],
      set: { kind: input.kind, reason: input.reason ?? null, createdBy: actorId, expiresAt, createdAt: new Date() },
    });

  if (blocksMembership(input.kind) && targetRole) {
    await db.delete(schema.tribeMembers).where(and(eq(schema.tribeMembers.tribeId, tribeId), eq(schema.tribeMembers.userId, input.userId)));
    await redis.srem(`tribe:${tribeId}:members`, input.userId);
    await db.update(schema.tribes).set({ memberCount: sql`GREATEST(member_count - 1, 0)` }).where(eq(schema.tribes.id, tribeId));
  }
  await recordAudit(actorId, `tribe.${input.kind}`, { tribeId, targetUserId: input.userId, reason: input.reason ?? null, expiresAt: expiresAt?.toISOString() ?? null });
  return { userId: input.userId, kind: input.kind, expiresAt: expiresAt?.toISOString() ?? null };
}

/** DELETE /api/tribes/:id/sanctions/:userId — lève la sanction (modérateur+). */
export async function liftSanction(tribeId: string, actorId: string, targetUserId: string): Promise<{ lifted: boolean }> {
  requireModerator(await roleOf(tribeId, actorId));
  const deleted = await db.delete(schema.tribeSanctions)
    .where(and(eq(schema.tribeSanctions.tribeId, tribeId), eq(schema.tribeSanctions.userId, targetUserId)))
    .returning({ userId: schema.tribeSanctions.userId });
  if (deleted.length > 0) await recordAudit(actorId, 'tribe.sanction_lifted', { tribeId, targetUserId });
  return { lifted: deleted.length > 0 };
}

/** GET /api/tribes/:id/sanctions — sanctions actives (modérateur+). */
export async function listSanctions(tribeId: string, actorId: string): Promise<{ sanctions: Array<{ userId: string; name: string; kind: SanctionKind; reason: string | null; expiresAt: string | null }> }> {
  requireModerator(await roleOf(tribeId, actorId));
  const rows = await db.select({ userId: schema.tribeSanctions.userId, name: schema.users.name, kind: schema.tribeSanctions.kind, reason: schema.tribeSanctions.reason, expiresAt: schema.tribeSanctions.expiresAt })
    .from(schema.tribeSanctions).innerJoin(schema.users, eq(schema.users.id, schema.tribeSanctions.userId))
    .where(eq(schema.tribeSanctions.tribeId, tribeId));
  return {
    sanctions: rows.filter((r) => isSanctionActive(r.expiresAt)).map((r) => ({ userId: r.userId, name: r.name, kind: r.kind as SanctionKind, reason: r.reason, expiresAt: r.expiresAt?.toISOString() ?? null })),
  };
}
