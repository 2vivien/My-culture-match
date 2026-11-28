import { sql } from 'drizzle-orm';
import { db } from '../../infrastructure/database';
import { AppError } from '../../shared/utils/AppError';
import { randomUUID } from 'node:crypto';

type RelationshipType = 'love' | 'friendship';
type PeriodKey = '1m' | '3m' | '6m' | '1y';
interface Message { id: string; senderId: string; text: string | null; type: string; createdAt: Date }
interface VectorProvider { embed(text: string): Promise<number[]>; model: string }

const STOP = new Set('le la les un une des de du au aux et ou en dans sur pour par avec sans que qui quoi est sont ce cette ces se sa son ses mon ma mes ton ta tes notre nos votre vos je tu il elle on nous vous ils elles moi toi lui eux a as ai avons avez ont suis es être avoir faire fait ça c est d aujourd hui pour dans avec mais donc alors quand comme très plus pas ne ni me te se'.split(' '));
const POSITIVE = new Set('merci rire drôle drole heureux heureuse content contente adore aime amour bravo magnifique génial genial superbe parfait confiance soutien sourire joie chance fier fiere respect bravo merci'.split(' '));
const TENSION = new Set('désolé desole pardon dispute colère colere triste déçu decu ignoré ignore silence problème probleme mal blessé blesse jamais toujours pourquoi arrête arrete'.split(' '));
const normalize = (s: string) => s.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ');
const tokens = (s: string) => normalize(s).split(/\s+/).filter((x) => x.length >= 4 && !STOP.has(x));

function hashVector(text: string, dims = 96): number[] {
  const v = Array.from({ length: dims }, () => 0); const ts = tokens(text);
  for (const t of ts) { let h = 2166136261; for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619); { const idx = Math.abs(h) % dims; v[idx] = (v[idx] ?? 0) + 1; } }
  const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0)); return norm ? v.map((x) => x / norm) : v;
}

const cosine = (a: number[], b: number[]) => { const n = Math.min(a.length, b.length); let d = 0, aa = 0, bb = 0; for (let i = 0; i < n; i++) { d += a[i]! * b[i]!; aa += a[i]! * a[i]!; bb += b[i]! * b[i]!; } return aa && bb ? d / Math.sqrt(aa * bb) : 0; };
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));

const fallbackProvider: VectorProvider = { model: 'hash-96', embed: async (text) => hashVector(text) };
const provider: VectorProvider = process.env.RELATIONSHIP_EMBEDDING_API_KEY && process.env.RELATIONSHIP_EMBEDDING_MODEL ? {
  model: process.env.RELATIONSHIP_EMBEDDING_MODEL,
  async embed(text: string) {
    const base = (process.env.RELATIONSHIP_EMBEDDING_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '');
    const r = await fetch(`${base}/embeddings`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.RELATIONSHIP_EMBEDDING_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.RELATIONSHIP_EMBEDDING_MODEL, input: text }) });
    if (!r.ok) throw new Error(`embedding HTTP ${r.status}`);
    const d = await r.json() as { data?: Array<{ embedding?: number[] }> };
    if (!d.data?.[0]?.embedding?.length) throw new Error('empty embedding');
    return d.data[0].embedding;
  },
} : fallbackProvider;

async function participants(conversationId: string, userId: string) {
  const rows = await db.execute(sql`SELECT user_id AS "userId" FROM conversation_participants WHERE conversation_id = ${conversationId}`) as unknown as Array<{ userId: string }>;
  const ids = rows.map((r) => r.userId); if (!ids.includes(userId)) throw AppError.forbidden('Vous n’êtes pas participant de cette conversation', 'NOT_A_PARTICIPANT'); return ids;
}
async function relationshipType(conversationId: string): Promise<RelationshipType> {
  const rows = await db.execute(sql`SELECT EXISTS(SELECT 1 FROM love_matches WHERE conversation_id = ${conversationId} AND is_mutual = true) AS "isLove"`) as unknown as Array<{ isLove: boolean }>;
  return rows[0]?.isLove ? 'love' : 'friendship';
}
async function messages(conversationId: string): Promise<Message[]> {
  const rows = await db.execute(sql`SELECT id, sender_id AS "senderId", text, type, created_at AS "createdAt" FROM messages WHERE conversation_id = ${conversationId} AND deleted_at IS NULL ORDER BY created_at ASC`) as unknown as Message[];
  return rows.map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
}

type Phase = { key: string; label: string; start: Date; end: Date; items: Message[]; activity: number; pos: number; ten: number };

function phasesFor(messages: Message[]): Phase[] {
  if (!messages.length) return [];
  const sorted = messages; const gaps = sorted.slice(1).map((m, i) => m.createdAt.getTime() - sorted[i]!.createdAt.getTime());
  const median = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)] ?? 0;
  const threshold = Math.max(48 * 3600000, Math.min(14 * 86400000, median * 8 || 48 * 3600000));
  const out: Array<{ key: string; label: string; start: Date; end: Date; items: Message[] }> = []; let bucket: Message[] = [sorted[0]!];
  for (let i = 1; i < sorted.length; i++) { if (sorted[i]!.createdAt.getTime() - sorted[i - 1]!.createdAt.getTime() > threshold) { out.push({ key: `phase-${out.length + 1}`, label: '', start: bucket[0]!.createdAt, end: bucket.at(-1)!.createdAt, items: bucket }); bucket = []; } bucket.push(sorted[i]!); }
  out.push({ key: `phase-${out.length + 1}`, label: '', start: bucket[0]!.createdAt, end: bucket.at(-1)!.createdAt, items: bucket });
  return out.map((p, i) => { const pos = p.items.reduce((n, m) => n + tokens(m.text ?? '').filter((t) => POSITIVE.has(t)).length, 0); const ten = p.items.reduce((n, m) => n + tokens(m.text ?? '').filter((t) => TENSION.has(t)).length, 0); const activity = clamp(p.items.length / Math.max(1, messages.length) * 3); const label = i === 0 ? 'Début de votre histoire' : pos > ten * 1.5 && pos >= 2 ? 'Période positive' : ten > pos * 1.5 && ten >= 2 ? 'Période plus difficile' : activity > 0.45 ? 'Période très active' : 'Nouvelle phase'; return { ...p, label, activity, pos, ten }; });
}

function termsFor(items: Message[], limit = 8) {
  const tf = new Map<string, number>(); const df = new Map<string, number>(); for (const m of items) { const seen = new Set(tokens(m.text ?? '')); for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1); for (const t of tokens(m.text ?? '')) tf.set(t, (tf.get(t) ?? 0) + 1); }
  return [...tf].map(([t, c]) => [t, c * Math.log(1 + items.length / (df.get(t) ?? 1))] as const).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([t]) => t);
}

async function semanticScore(text: string, queryTerms: string[]) { const a = await provider.embed(text); const b = await provider.embed(queryTerms.join(' ')); return clamp((cosine(a, b) + 1) / 2); }

export async function rebuildRelationshipMemoryV2(conversationId: string, userId: string) {
  await participants(conversationId, userId); const type = await relationshipType(conversationId); const msgs = await messages(conversationId); if (!msgs.length) return { relationshipType: type, memories: [], phases: [], messageCount: 0, embeddingModel: provider.model };
  const phases = phasesFor(msgs);
  await db.execute(sql`DELETE FROM relationship_memory_phases WHERE conversation_id = ${conversationId}`);
  for (const p of phases) {
    const terms = termsFor(p.items); const text = p.items.map((m) => m.text ?? '').join(' ').slice(0, 12000); const embedding = await provider.embed(text);
    await db.execute(sql`INSERT INTO relationship_memory_phases (id, conversation_id, phase_key, label, started_at, ended_at, message_count, activity_score, topic_terms, embedding, confidence, algorithm_version) VALUES (${randomUUID()}, ${conversationId}, ${p.key}, ${p.label}, ${p.start}, ${p.end}, ${p.items.length}, ${p.activity}, ${JSON.stringify(terms)}, ${JSON.stringify(embedding)}, ${clamp(0.55 + p.items.length / Math.max(msgs.length, 1) * 0.4)}, 'v2')`);
  }

  const candidates: Array<{ kind: string; title: string; summary: string; date: Date; actor: string | null; evidence: string[]; confidence: number; importance: number; semantic: number; phase: string }> = [];
  const first = msgs[0]!; candidates.push({ kind: 'first', title: 'Le début de votre histoire', summary: `La conversation a commencé avec un message de ${first.senderId === userId ? 'toi' : 'ton interlocuteur'}.`, date: first.createdAt, actor: first.senderId, evidence: [first.id], confidence: .99, importance: .96, semantic: 1, phase: phases[0]!.key });
  const firstMedia = msgs.find((m) => m.type !== 'text'); if (firstMedia) candidates.push({ kind: 'media', title: 'Premier contenu partagé', summary: `Votre premier contenu partagé était de type ${firstMedia.type}.`, date: firstMedia.createdAt, actor: firstMedia.senderId, evidence: [firstMedia.id], confidence: .98, importance: .72, semantic: 1, phase: phases.find((p) => firstMedia.createdAt >= p.start && firstMedia.createdAt <= p.end)?.key ?? phases[0]!.key });
  for (const p of phases) {
    const terms = termsFor(p.items); if (!terms.length) continue; const semantic = await semanticScore(p.items.map((m) => m.text ?? '').join(' ').slice(0, 6000), terms); const intensity = clamp(p.items.length / 20); const reciprocity = (() => { const c = new Map<string, number>(); for (const m of p.items) c.set(m.senderId, (c.get(m.senderId) ?? 0) + 1); const v = [...c.values()]; return v.length > 1 ? Math.min(...v) / Math.max(...v) : 0.2; })(); const importance = clamp(.25 * intensity + .25 * semantic + .2 * reciprocity + .15 * (p.pos > p.ten ? 1 : 0.4) + .15 * (p.items.length > 8 ? 1 : .4)); candidates.push({ kind: p.pos > p.ten * 1.5 && p.pos >= 2 ? 'positive' : p.ten > p.pos * 1.5 && p.ten >= 2 ? 'tension' : 'turning_point', title: p.label, summary: `Cette phase se distingue par ${p.items.length} messages, avec des thèmes récurrents autour de ${terms.slice(0, 4).join(', ')}.`, date: p.start, actor: null, evidence: p.items.slice(0, 12).map((m) => m.id), confidence: clamp(.55 + intensity * .35 + reciprocity * .1), importance, semantic, phase: p.key });
  }

  await db.execute(sql`DELETE FROM relationship_memories WHERE conversation_id = ${conversationId}`);
  for (const c of candidates.sort((a, b) => b.importance - a.importance)) await db.execute(sql`INSERT INTO relationship_memories (id, conversation_id, relationship_type, kind, title, summary, occurred_at, actor_user_id, evidence_message_ids, metadata, confidence, importance, source, embedding, phase_key, semantic_score, algorithm_version) VALUES (${randomUUID()}, ${conversationId}, ${type}, ${c.kind}, ${c.title}, ${c.summary}, ${c.date}, ${c.actor}, ${JSON.stringify(c.evidence)}, ${JSON.stringify({ embeddingModel: provider.model })}, ${c.confidence}, ${c.importance}, 'algorithm-v2', ${JSON.stringify(await provider.embed(c.summary))}, ${c.phase}, ${c.semantic}, 'v2')`);
  await db.execute(sql`UPDATE relationship_memory_runs SET algorithm_version = 'v2', analyzed_message_count = ${msgs.length}, last_message_at = ${msgs.at(-1)!.createdAt}, updated_at = now() WHERE conversation_id = ${conversationId}`);
  return { relationshipType: type, memories: candidates, phases, messageCount: msgs.length, embeddingModel: provider.model };
}

function period(period: PeriodKey, end = new Date()) { const months = period === '1m' ? 1 : period === '3m' ? 3 : period === '6m' ? 6 : 12; const start = new Date(end); start.setMonth(start.getMonth() - months); return { start, end }; }

async function llmNarrative(type: RelationshipType, periodKey: PeriodKey, memories: Array<{ id: string; title: string; summary: string; occurred_at: Date; importance: number }>) {
  const fallback = type === 'love' ? `Votre Love Story a traversé cette période autour de ${memories.slice(0, 3).map((m) => m.title).join(', ')}.` : `Votre amitié a été marquée pendant cette période par ${memories.slice(0, 3).map((m) => m.title).join(', ')}.`;
  if (process.env.RELATIONSHIP_RECAP_AI_ENABLED !== 'true' || !process.env.RELATIONSHIP_RECAP_AI_API_KEY || !process.env.RELATIONSHIP_RECAP_AI_MODEL) return { narrative: fallback, model: null };
  const base = (process.env.RELATIONSHIP_RECAP_AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, ''); const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), Number(process.env.RELATIONSHIP_RECAP_AI_TIMEOUT_MS ?? 10000));
  try { const evidence = memories.map((m) => ({ id: m.id, title: m.title, summary: m.summary, date: m.occurred_at, importance: m.importance })); const r = await fetch(`${base}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.RELATIONSHIP_RECAP_AI_API_KEY}`, 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ model: process.env.RELATIONSHIP_RECAP_AI_MODEL, temperature: .35, messages: [{ role: 'system', content: `Tu écris un recap ${type === 'love' ? 'Love Story' : 'Friendship Timeline'}. Utilise UNIQUEMENT les événements fournis. N'invente aucun fait, date, sentiment, intention ou responsabilité. Ne révèle pas de contenu supprimé. Réponds en français, 2 à 5 paragraphes, chaleureux mais factuel.` }, { role: 'user', content: JSON.stringify({ period: periodKey, evidence }) }] }) }); if (!r.ok) throw new Error(`recap AI HTTP ${r.status}`); const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> }; return { narrative: d.choices?.[0]?.message?.content?.trim() || fallback, model: process.env.RELATIONSHIP_RECAP_AI_MODEL }; } catch { return { narrative: fallback, model: null }; } finally { clearTimeout(timer); }
}

export async function generateRelationshipRecap(conversationId: string, userId: string, periodKey: PeriodKey) {
  await participants(conversationId, userId); const type = await relationshipType(conversationId); const { start, end } = period(periodKey); const rows = await db.execute(sql`SELECT id, title, summary, occurred_at, importance FROM relationship_memories WHERE conversation_id = ${conversationId} AND occurred_at BETWEEN ${start} AND ${end} ORDER BY importance DESC, occurred_at ASC LIMIT 24`) as unknown as Array<{ id: string; title: string; summary: string; occurred_at: Date; importance: number }>;
  if (!rows.length) throw AppError.notFound('Pas encore assez de souvenirs pour cette période', 'RECAP_NOT_READY'); const result = await llmNarrative(type, periodKey, rows); const title = type === 'love' ? `Love Story · ${periodKey}` : `Friendship Timeline · ${periodKey}`;
  await db.execute(sql`INSERT INTO relationship_memory_recaps (id, conversation_id, relationship_type, period_key, period_start, period_end, title, narrative, evidence_memory_ids, model) VALUES (${randomUUID()}, ${conversationId}, ${type}, ${periodKey}, ${start}, ${end}, ${title}, ${result.narrative}, ${JSON.stringify(rows.map((r) => r.id))}, ${result.model}) ON CONFLICT (conversation_id, period_key) DO UPDATE SET narrative = EXCLUDED.narrative, evidence_memory_ids = EXCLUDED.evidence_memory_ids, model = EXCLUDED.model, generated_at = now()`);
  return { relationshipType: type, periodKey, title, narrative: result.narrative, evidenceMemoryIds: rows.map((r) => r.id), model: result.model };
}

export async function listRelationshipRecaps(conversationId: string, userId: string) { await participants(conversationId, userId); return await db.execute(sql`SELECT id, relationship_type, period_key, period_start, period_end, title, narrative, evidence_memory_ids, model, generated_at FROM relationship_memory_recaps WHERE conversation_id = ${conversationId} ORDER BY period_start DESC`) as unknown as Array<Record<string, unknown>>; }
