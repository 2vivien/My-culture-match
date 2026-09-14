import { sql } from 'drizzle-orm';
import { db } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';
import { randomUUID } from 'node:crypto';

type RelationshipType = 'love' | 'friendship';
type MemoryKind = 'first' | 'milestone' | 'positive' | 'tension' | 'rhythm' | 'shared_interest' | 'media' | 'turning_point';

interface RawMessage {
  id: string;
  senderId: string;
  text: string | null;
  type: string;
  createdAt: Date;
}

interface MemoryRow {
  id: string;
  relationship_type: RelationshipType;
  kind: string;
  title: string;
  summary: string;
  occurred_at: Date;
  actor_user_id: string | null;
  evidence_message_ids: string[];
  metadata: Record<string, unknown>;
  confidence: number;
  importance: number;
  source: string;
}

const STOPWORDS = new Set('le la les un une des de du au aux et ou en dans sur pour par avec sans que qui quoi est sont ce cette ces se sa son ses mon ma mes ton ta tes notre nos votre vos je tu il elle on nous vous ils elles moi toi lui eux a as ai avons avez ont suis es suis être avoir faire fait ça ce c est d aujourd hui aujourd'.split(' '));
const POSITIVE = new Set('merci merci beaucoup rire drôle drole heureux heureuse content contente adore aime amour bravo magnifique génial genial superbe parfait félicitations felicitation confiance confiance soutien soutient sourire rire chance heureux joie'.split(' '));
const TENSION = new Set('désolé desole pardon dispute colère colere triste déçu decu ignoré ignore silence problème probleme mal blessé blesse jamais toujours pourquoi arrête arrete'.split(' '));

function tokenize(text: string): string[] {
  return text.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter((x) => x.length >= 4 && !STOPWORDS.has(x));
}

function dominantTerms(messages: RawMessage[], limit = 5): string[] {
  const tf = new Map<string, number>();
  const df = new Map<string, number>();
  for (const message of messages) {
    if (!message.text) continue;
    const terms = tokenize(message.text);
    const seen = new Set<string>();
    for (const term of terms) {
      tf.set(term, (tf.get(term) ?? 0) + 1);
      if (!seen.has(term)) df.set(term, (df.get(term) ?? 0) + 1);
      seen.add(term);
    }
  }
  const n = Math.max(messages.length, 1);
  return [...tf.entries()]
    .map(([term, count]) => [term, count * Math.log(1 + n / (df.get(term) ?? 1))] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term);
}

function scoreSentiment(messages: RawMessage[]): { positive: number; tension: number } {
  let positive = 0;
  let tension = 0;
  for (const message of messages) {
    if (!message.text) continue;
    const terms = tokenize(message.text);
    positive += terms.filter((t) => POSITIVE.has(t)).length;
    tension += terms.filter((t) => TENSION.has(t)).length;
  }
  return { positive, tension };
}

function relationshipTypeFromRows(rows: Array<{ isLove: boolean }>): RelationshipType {
  return rows[0]?.isLove ? 'love' : 'friendship';
}

async function getParticipants(conversationId: string, userId: string): Promise<string[]> {
  const result = await db.execute(sql`
    SELECT cp.user_id AS "userId"
    FROM conversation_participants cp
    WHERE cp.conversation_id = ${conversationId}
  `) as unknown as Array<{ userId: string }>;
  const ids = result.map((r) => r.userId);
  if (!ids.includes(userId)) throw AppError.forbidden('Vous n’êtes pas participant de cette conversation', 'NOT_A_PARTICIPANT');
  return ids;
}

async function getRelationshipType(conversationId: string): Promise<RelationshipType> {
  const rows = await db.execute(sql`
    SELECT EXISTS(
      SELECT 1 FROM love_matches lm
      WHERE lm.conversation_id = ${conversationId} AND lm.is_mutual = true
    ) AS "isLove"
  `) as unknown as Array<{ isLove: boolean }>;
  return relationshipTypeFromRows(rows);
}

async function loadMessages(conversationId: string): Promise<RawMessage[]> {
  const rows = await db.execute(sql`
    SELECT id, sender_id AS "senderId", text, type, created_at AS "createdAt"
    FROM messages
    WHERE conversation_id = ${conversationId}
      AND deleted_at IS NULL
    ORDER BY created_at ASC
  `) as unknown as RawMessage[];
  return rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt) }));
}

function pickActor(messages: RawMessage[], predicate: (m: RawMessage) => boolean): RawMessage | null {
  return messages.find(predicate) ?? null;
}

function eventBase(
  relationshipType: RelationshipType,
  kind: MemoryKind,
  title: string,
  summary: string,
  occurredAt: Date,
  actorUserId: string | null,
  evidence: string[],
  confidence: number,
  importance: number,
  metadata: Record<string, unknown> = {},
) {
  return { relationshipType, kind, title, summary, occurredAt, actorUserId, evidence, confidence, importance, metadata };
}

/**
 * Deterministic memory extraction. No LLM is used here by design.
 * The engine combines temporal statistics, turn-taking, TF-IDF-like term salience,
 * message-type transitions and lightweight lexical sentiment signals.
 */
export async function rebuildRelationshipMemory(conversationId: string, requestingUserId: string) {
  await getParticipants(conversationId, requestingUserId);
  const relationshipType = await getRelationshipType(conversationId);
  const messages = await loadMessages(conversationId);
  if (messages.length === 0) return { relationshipType, memories: [], messageCount: 0 };

  const memories = [] as ReturnType<typeof eventBase>[];
  const first = messages[0]!;
  memories.push(eventBase(relationshipType, 'first', 'Premier message', `La conversation a commencé avec un message de ${first.senderId === requestingUserId ? 'toi' : 'ton interlocuteur'}.`, first.createdAt, first.senderId, [first.id], 0.99, 0.95));

  const firstReply = messages.find((m, i) => i > 0 && m.senderId !== first.senderId);
  if (firstReply) {
    memories.push(eventBase(relationshipType, 'first', 'Première réponse', 'Le premier échange à deux a commencé avec une réponse de l’autre personne.', firstReply.createdAt, firstReply.senderId, [first.id, firstReply.id], 0.99, 0.9));
  }

  const firstMedia = pickActor(messages, (m) => m.type !== 'text');
  if (firstMedia) {
    memories.push(eventBase(relationshipType, 'media', 'Premier souvenir partagé', `Votre premier contenu partagé était de type ${firstMedia.type}.`, firstMedia.createdAt, firstMedia.senderId, [firstMedia.id], 0.98, 0.72, { mediaType: firstMedia.type }));
  }

  const firstLong = [...messages].filter((m) => (m.text?.length ?? 0) >= 300).sort((a, b) => (b.text?.length ?? 0) - (a.text?.length ?? 0))[0];
  if (firstLong) {
    memories.push(eventBase(relationshipType, 'milestone', 'Première grande conversation', 'Un message particulièrement développé marque l’un des premiers échanges profonds détectables.', firstLong.createdAt, firstLong.senderId, [firstLong.id], 0.86, 0.82, { characters: firstLong.text?.length ?? 0 }));
  }

  let longest = messages[0]!;
  for (const m of messages) if ((m.text?.length ?? 0) > (longest.text?.length ?? 0)) longest = m;
  if ((longest.text?.length ?? 0) >= 250) {
    memories.push(eventBase(relationshipType, 'milestone', 'Message le plus développé', 'C’est le message le plus long détecté dans votre histoire.', longest.createdAt, longest.senderId, [longest.id], 1, 0.65, { characters: longest.text?.length ?? 0 }));
  }

  const terms = dominantTerms(messages);
  if (terms.length >= 2) {
    const evidence = messages.filter((m) => m.text && terms.some((t) => tokenize(m.text!).includes(t))).slice(0, 8).map((m) => m.id);
    memories.push(eventBase(relationshipType, 'shared_interest', 'Vos sujets récurrents', `Des thèmes reviennent régulièrement dans vos échanges : ${terms.join(', ')}.`, messages[Math.floor(messages.length / 2)]!.createdAt, null, evidence, 0.76, 0.78, { terms }));
  }

  const byDay = new Map<string, RawMessage[]>();
  for (const m of messages) {
    const key = m.createdAt.toISOString().slice(0, 10);
    const arr = byDay.get(key) ?? [];
    arr.push(m);
    byDay.set(key, arr);
  }
  const busiest = [...byDay.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (busiest && busiest[1].length >= 8) {
    memories.push(eventBase(relationshipType, 'rhythm', 'Votre journée la plus active', `C’est la journée où vous avez échangé le plus de messages (${busiest[1].length}).`, busiest[1][0]!.createdAt, null, busiest[1].slice(0, 20).map((m) => m.id), 0.99, 0.74, { messageCount: busiest[1].length }));
  }

  let maxBurst: RawMessage[] = [];
  for (let i = 0; i < messages.length; i++) {
    const burst = messages.slice(i, i + 20);
    if (burst.length < 8) continue;
    const span = burst[burst.length - 1]!.createdAt.getTime() - burst[0]!.createdAt.getTime();
    if (span <= 2 * 60 * 60 * 1000 && burst.length > maxBurst.length) maxBurst = burst;
  }
  if (maxBurst.length >= 8) {
    memories.push(eventBase(relationshipType, 'turning_point', 'Une conversation particulièrement intense', 'Un échange très concentré dans le temps ressort comme un moment important de votre rythme de conversation.', maxBurst[0]!.createdAt, null, maxBurst.map((m) => m.id), 0.8, 0.8, { messages: maxBurst.length, durationMinutes: Math.round((maxBurst.at(-1)!.createdAt.getTime() - maxBurst[0]!.createdAt.getTime()) / 60000) }));
  }

  const sentiment = scoreSentiment(messages.slice(-200));
  if (sentiment.positive >= 6) {
    const positiveMessages = messages.filter((m) => m.text && tokenize(m.text).some((t) => POSITIVE.has(t))).slice(-8);
    memories.push(eventBase(relationshipType, 'positive', 'Un moment très positif', 'Plusieurs signaux lexicaux positifs apparaissent dans vos échanges récents.', positiveMessages[0]?.createdAt ?? messages.at(-1)!.createdAt, positiveMessages[0]?.senderId ?? null, positiveMessages.map((m) => m.id), 0.7, 0.7, { positiveSignals: sentiment.positive }));
  }
  if (sentiment.tension >= 5) {
    const tensionMessages = messages.filter((m) => m.text && tokenize(m.text).some((t) => TENSION.has(t))).slice(-8);
    memories.push(eventBase(relationshipType, 'tension', 'Un moment plus difficile', 'Des marqueurs de tension apparaissent dans cette partie de la conversation. Le système ne détermine pas la cause ni la responsabilité.', tensionMessages[0]?.createdAt ?? messages.at(-1)!.createdAt, tensionMessages[0]?.senderId ?? null, tensionMessages.map((m) => m.id), 0.62, 0.6, { tensionSignals: sentiment.tension }));
  }

  const senders = new Set(messages.map((m) => m.senderId));
  const counts = new Map<string, number>();
  for (const m of messages) counts.set(m.senderId, (counts.get(m.senderId) ?? 0) + 1);
  const values = [...counts.values()];
  if (senders.size >= 2 && Math.min(...values) / Math.max(...values) >= 0.35) {
    memories.push(eventBase(relationshipType, 'rhythm', 'Un échange réciproque', 'Les deux personnes participent de manière relativement équilibrée à la conversation.', messages[Math.floor(messages.length / 2)]!.createdAt, null, messages.slice(Math.max(0, messages.length - 20)).map((m) => m.id), 0.92, 0.76, { participationRatio: Math.min(...values) / Math.max(...values) }));
  }

  await db.execute(sql`DELETE FROM relationship_memories WHERE conversation_id = ${conversationId}`);
  for (const memory of memories.sort((a, b) => b.importance - a.importance)) {
    await db.execute(sql`
      INSERT INTO relationship_memories
        (id, conversation_id, relationship_type, kind, title, summary, occurred_at, actor_user_id, evidence_message_ids, metadata, confidence, importance, source)
      VALUES
        (${randomUUID()}, ${conversationId}, ${memory.relationshipType}, ${memory.kind}, ${memory.title}, ${memory.summary}, ${memory.occurredAt}, ${memory.actorUserId}, ${JSON.stringify(memory.evidence)}, ${JSON.stringify(memory.metadata)}, ${memory.confidence}, ${memory.importance}, 'algorithm')
    `);
  }
  await db.execute(sql`
    INSERT INTO relationship_memory_runs (conversation_id, last_message_at, analyzed_message_count, algorithm_version, updated_at)
    VALUES (${conversationId}, ${messages.at(-1)!.createdAt}, ${messages.length}, 'v1', now())
    ON CONFLICT (conversation_id) DO UPDATE SET last_message_at = EXCLUDED.last_message_at, analyzed_message_count = EXCLUDED.analyzed_message_count, algorithm_version = EXCLUDED.algorithm_version, updated_at = now()
  `);

  return { relationshipType, memories, messageCount: messages.length };
}

export async function getRelationshipTimeline(conversationId: string, userId: string) {
  await getParticipants(conversationId, userId);
  const relationshipType = await getRelationshipType(conversationId);
  const memories = await db.execute(sql`
    SELECT id, relationship_type, kind, title, summary, occurred_at, actor_user_id, evidence_message_ids, metadata, confidence, importance, source
    FROM relationship_memories
    WHERE conversation_id = ${conversationId}
    ORDER BY occurred_at ASC, importance DESC
  `) as unknown as MemoryRow[];
  const capsules = await db.execute(sql`
    SELECT id, relationship_type, author_user_id, title, body, media_urls, event_date, created_at
    FROM relationship_capsules
    WHERE conversation_id = ${conversationId}
    ORDER BY event_date DESC
  `) as unknown as Array<Record<string, unknown>>;
  return { relationshipType, memories, capsules };
}

export async function createRelationshipCapsule(input: {
  conversationId: string;
  userId: string;
  title?: string;
  body?: string;
  mediaUrls?: string[];
  eventDate?: string;
}) {
  await getParticipants(input.conversationId, input.userId);
  const relationshipType = await getRelationshipType(input.conversationId);
  if (!input.body?.trim() && !(input.mediaUrls?.length)) throw AppError.badRequest('Une capsule doit contenir une note ou un média', 'EMPTY_CAPSULE');
  const id = randomUUID();
  await db.execute(sql`
    INSERT INTO relationship_capsules (id, conversation_id, relationship_type, author_user_id, title, body, media_urls, event_date)
    VALUES (${id}, ${input.conversationId}, ${relationshipType}, ${input.userId}, ${input.title?.trim() || null}, ${input.body?.trim() || null}, ${JSON.stringify(input.mediaUrls ?? [])}, ${input.eventDate ? new Date(input.eventDate) : new Date()})
  `);
  return { id, relationshipType };
}

export async function refreshAfterMessage(conversationId: string, userId: string) {
  try {
    await rebuildRelationshipMemory(conversationId, userId);
  } catch {
    // Memory generation is deliberately non-blocking for chat delivery.
  }
}
