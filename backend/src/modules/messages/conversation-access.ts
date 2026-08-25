import { and, eq } from 'drizzle-orm';
import { db, schema } from '../../infrastructure/database';

/** Vérifie côté serveur l'appartenance d'un utilisateur à une conversation. */
export async function isConversationParticipant(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ userId: schema.conversationParticipants.userId })
    .from(schema.conversationParticipants)
    .where(
      and(
        eq(schema.conversationParticipants.conversationId, conversationId),
        eq(schema.conversationParticipants.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}
