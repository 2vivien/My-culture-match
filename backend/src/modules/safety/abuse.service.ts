import { db, schema } from '../../infrastructure/database';
import { redis } from '../../infrastructure/redis';
import { AppError } from '../../shared/utils/AppError';

const REPEAT_TTL = 10 * 60;
const MAX_DUPLICATES = 4;
const URL_LIMIT = 4;

function abuseKey(userId: string) { return `abuse:message:${userId}`; }
function normalize(text: string) { return text.trim().toLowerCase().replace(/\s+/g, ' '); }

export async function inspectOutgoingMessage(userId: string, conversationId: string, text: string | null): Promise<void> {
  if (!text) return;
  const normalized = normalize(text);
  const urls = normalized.match(/https?:\/\/\S+/g) ?? [];
  if (urls.length > URL_LIMIT) throw AppError.tooMany('Trop de liens dans ce message', 'MESSAGE_LINK_SPAM');

  const key = `${abuseKey(userId)}:${Buffer.from(normalized).toString('base64url').slice(0, 80)}`;
  const duplicateCount = await redis.incr(key);
  if (duplicateCount === 1) await redis.expire(key, REPEAT_TTL);
  if (duplicateCount > MAX_DUPLICATES) throw AppError.tooMany('Ce message est envoyé trop souvent', 'MESSAGE_DUPLICATE_SPAM');

  const riskReasons: string[] = [];
  if (/(.)\1{9,}/.test(normalized)) riskReasons.push('repeated_characters');
  if ((normalized.match(/@/g) ?? []).length > 8) riskReasons.push('mention_spam');
  if (normalized.length > 1500 && urls.length >= 2) riskReasons.push('promotional_spam');

  if (riskReasons.length > 0) {
    await db.insert(schema.abuseEvents).values({ actorId: userId, conversationId, eventType: 'message_risk', risk: 'medium', reasons: riskReasons.join(','), contentFingerprint: normalized.slice(0, 160) });
  }
}
