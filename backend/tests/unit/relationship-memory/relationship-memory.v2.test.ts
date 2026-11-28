import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function sqlText(q: unknown): string {
  const chunks = (q as { queryChunks?: unknown[] }).queryChunks ?? [];
  return chunks.map((c) => (c && typeof c === 'object' && 'value' in c ? (c as { value: string[] }).value.join('') : '?')).join('');
}

const h = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock('../../../src/infrastructure/database', () => ({ db: { execute: h.execute } }));

import {
  generateRelationshipRecap, listRelationshipRecaps, rebuildRelationshipMemoryV2,
} from '../../../src/modules/relationship-memory/relationship-memory.v2';

type Msg = { id: string; senderId: string; text: string | null; type: string; createdAt: Date };
const H = 3600_000;
const t0 = Date.UTC(2026, 0, 1, 10);
const msg = (id: string, senderId: string, text: string | null, hours: number, type = 'text'): Msg => ({ id, senderId, text, type, createdAt: new Date(t0 + hours * H) });

/** Simule la base : participants, type de relation, messages, puis journal des requêtes d'écriture. */
function fakeDb(opts: { participants?: string[]; isLove?: boolean; messages?: Msg[]; memories?: unknown[] }) {
  const writes: string[] = [];
  h.execute.mockImplementation(async (q: unknown) => {
    const t = sqlText(q);
    if (t.includes('FROM conversation_participants')) return (opts.participants ?? ['alice', 'bob']).map((userId) => ({ userId }));
    if (t.includes('FROM love_matches')) return [{ isLove: opts.isLove ?? false }];
    if (t.includes('FROM messages')) return opts.messages ?? [];
    if (t.includes('FROM relationship_memories')) return opts.memories ?? [];
    if (t.includes('FROM relationship_memory_recaps')) return [{ id: 'rc1' }];
    writes.push(t);
    return [];
  });
  return writes;
}

beforeEach(() => vi.clearAllMocks());

describe('rebuildRelationshipMemoryV2', () => {
  it('refuse un utilisateur qui ne participe pas à la conversation', async () => {
    fakeDb({ participants: ['alice', 'bob'] });
    await expect(rebuildRelationshipMemoryV2('c1', 'eve')).rejects.toMatchObject({ status: 403, code: 'NOT_A_PARTICIPANT' });
  });

  it('renvoie un résultat vide sans rien écrire quand il n’y a aucun message', async () => {
    const writes = fakeDb({ messages: [] });
    const out = await rebuildRelationshipMemoryV2('c1', 'alice');
    expect(out).toMatchObject({ relationshipType: 'friendship', memories: [], phases: [], messageCount: 0, embeddingModel: 'hash-96' });
    expect(writes).toEqual([]);
  });

  it('découpe la conversation en phases séparées par un silence de plus de 48h', async () => {
    const messages = [
      msg('m1', 'alice', 'Bonjour, merci pour la soirée, génial moment ensemble', 0),
      msg('m2', 'bob', 'Merci à toi, vraiment superbe soirée, content', 1),
      msg('m3', 'alice', 'Voyage prévu ensemble ?', 2),
      msg('m4', 'bob', 'Désolé pour hier, dispute stupide, pardon', 24 * 10),
      msg('m5', 'alice', 'Silence entre nous, triste, problème', 24 * 10 + 1),
    ];
    const out = await rebuildRelationshipMemoryV2('c1', 'alice');
    void out;
    const writes = fakeDb({ messages });
    const res = await rebuildRelationshipMemoryV2('c1', 'alice');
    expect(res.messageCount).toBe(5);
    expect(res.phases).toHaveLength(2);
    expect(res.phases[0]).toMatchObject({ key: 'phase-1', label: 'Début de votre histoire' });
    expect(res.phases[0]!.items.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
    expect(res.phases[1]!.items.map((m) => m.id)).toEqual(['m4', 'm5']);
    expect(res.phases[1]).toMatchObject({ label: 'Période plus difficile' });
    // phases : 1 suppression + 2 insertions ; souvenirs : 1 suppression + N insertions ; 1 mise à jour du run
    expect(writes.filter((w) => w.startsWith('DELETE FROM relationship_memory_phases'))).toHaveLength(1);
    expect(writes.filter((w) => w.startsWith('INSERT INTO relationship_memory_phases'))).toHaveLength(2);
    expect(writes.filter((w) => w.startsWith('INSERT INTO relationship_memories'))).toHaveLength(res.memories.length);
    expect(writes.some((w) => w.startsWith('UPDATE relationship_memory_runs'))).toBe(true);
  });

  it('crée un souvenir « début » attribué au premier expéditeur et trie par importance', async () => {
    fakeDb({ messages: [msg('m1', 'bob', 'Salut, enchanté de te rencontrer', 0), msg('m2', 'alice', 'Moi aussi, enchantée', 1)] });
    const res = await rebuildRelationshipMemoryV2('c1', 'alice');
    const first = res.memories.find((m) => m.kind === 'first')!;
    expect(first).toMatchObject({ actor: 'bob', evidence: ['m1'], importance: 0.96, phase: 'phase-1' });
    expect(first.summary).toContain('ton interlocuteur');
    const second = await (async () => {
      fakeDb({ messages: [msg('m1', 'alice', 'Salut, enchanté', 0)] });
      return rebuildRelationshipMemoryV2('c1', 'alice');
    })();
    expect(second.memories.find((m) => m.kind === 'first')!.summary).toContain('toi');
  });

  it('ajoute un souvenir « premier contenu partagé » pour le premier média', async () => {
    fakeDb({ messages: [msg('m1', 'alice', 'Regarde', 0), msg('m2', 'bob', null, 1, 'image'), msg('m3', 'alice', null, 2, 'voice')] });
    const res = await rebuildRelationshipMemoryV2('c1', 'alice');
    const media = res.memories.filter((m) => m.kind === 'media');
    expect(media).toHaveLength(1);
    expect(media[0]).toMatchObject({ evidence: ['m2'], actor: 'bob' });
    expect(media[0]!.summary).toContain('image');
  });

  it('marque la conversation comme « love » quand un match mutuel existe', async () => {
    fakeDb({ isLove: true, messages: [msg('m1', 'alice', 'Bonsoir', 0)] });
    const res = await rebuildRelationshipMemoryV2('c1', 'alice');
    expect(res.relationshipType).toBe('love');
  });

  it('qualifie une phase très positive de « Période positive » après le début', async () => {
    const positive = 'merci adore magnifique génial superbe parfait confiance bravo';
    fakeDb({
      messages: [
        msg('m1', 'alice', 'Bonjour', 0),
        msg('m2', 'bob', positive, 24 * 20),
        msg('m3', 'alice', positive, 24 * 20 + 1),
      ],
    });
    const res = await rebuildRelationshipMemoryV2('c1', 'alice');
    expect(res.phases.map((p) => p.label)).toEqual(['Début de votre histoire', 'Période positive']);
    expect(res.memories.some((m) => m.kind === 'positive')).toBe(true);
  });
});

describe('generateRelationshipRecap', () => {
  const memories = [
    { id: 'mem1', title: 'Le début de votre histoire', summary: 's1', occurred_at: new Date(), importance: 0.9 },
    { id: 'mem2', title: 'Période positive', summary: 's2', occurred_at: new Date(), importance: 0.7 },
  ];
  const AI_KEYS = ['RELATIONSHIP_RECAP_AI_ENABLED', 'RELATIONSHIP_RECAP_AI_API_KEY', 'RELATIONSHIP_RECAP_AI_MODEL', 'RELATIONSHIP_RECAP_AI_BASE_URL'];
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => { for (const k of AI_KEYS) { saved[k] = process.env[k]; delete process.env[k]; } });
  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of AI_KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
  });

  it('renvoie 404 quand il n’y a pas encore de souvenirs sur la période', async () => {
    fakeDb({ memories: [] });
    await expect(generateRelationshipRecap('c1', 'alice', '1m')).rejects.toMatchObject({ status: 404, code: 'RECAP_NOT_READY' });
  });

  it('refuse un non-participant', async () => {
    fakeDb({ memories });
    await expect(generateRelationshipRecap('c1', 'eve', '3m')).rejects.toMatchObject({ status: 403 });
  });

  it('génère un récap « Love Story » factuel sans IA et l’enregistre (upsert)', async () => {
    const writes = fakeDb({ isLove: true, memories });
    const recap = await generateRelationshipRecap('c1', 'alice', '6m');
    expect(recap).toMatchObject({ relationshipType: 'love', periodKey: '6m', title: 'Love Story · 6m', model: null, evidenceMemoryIds: ['mem1', 'mem2'] });
    expect(recap.narrative).toContain('Love Story');
    expect(recap.narrative).toContain('Le début de votre histoire, Période positive');
    expect(writes.some((w) => w.includes('ON CONFLICT (conversation_id, period_key) DO UPDATE'))).toBe(true);
  });

  it('génère un récap « Friendship Timeline » pour une amitié', async () => {
    fakeDb({ isLove: false, memories });
    const recap = await generateRelationshipRecap('c1', 'alice', '1y');
    expect(recap.title).toBe('Friendship Timeline · 1y');
    expect(recap.narrative).toMatch(/^Votre amitié/);
  });

  it('utilise le texte de l’IA quand elle est activée et ne lui envoie que les souvenirs', async () => {
    process.env.RELATIONSHIP_RECAP_AI_ENABLED = 'true';
    process.env.RELATIONSHIP_RECAP_AI_API_KEY = 'cle';
    process.env.RELATIONSHIP_RECAP_AI_MODEL = 'm-test';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: '  Un beau récit.  ' } }] }) });
    vi.stubGlobal('fetch', fetchMock);
    fakeDb({ memories });
    const recap = await generateRelationshipRecap('c1', 'alice', '1m');
    expect(recap).toMatchObject({ narrative: 'Un beau récit.', model: 'm-test' });
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as { body: string }).body);
    expect(JSON.parse(body.messages[1].content)).toMatchObject({ period: '1m', evidence: [{ id: 'mem1' }, { id: 'mem2' }] });
  });

  it.each([
    ['erreur HTTP', { ok: false, json: async () => ({}) }],
    ['réponse vide', { ok: true, json: async () => ({ choices: [{ message: { content: '   ' } }] }) }],
  ])('retombe sur le récit factuel en cas de %s de l’IA', async (_l, response) => {
    process.env.RELATIONSHIP_RECAP_AI_ENABLED = 'true';
    process.env.RELATIONSHIP_RECAP_AI_API_KEY = 'cle';
    process.env.RELATIONSHIP_RECAP_AI_MODEL = 'm-test';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    fakeDb({ memories });
    const recap = await generateRelationshipRecap('c1', 'alice', '1m');
    expect(recap.narrative).toContain('Votre amitié');
  });

  it('retombe sur le récit factuel si le réseau échoue', async () => {
    process.env.RELATIONSHIP_RECAP_AI_ENABLED = 'true';
    process.env.RELATIONSHIP_RECAP_AI_API_KEY = 'cle';
    process.env.RELATIONSHIP_RECAP_AI_MODEL = 'm-test';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    fakeDb({ memories });
    const recap = await generateRelationshipRecap('c1', 'alice', '3m');
    expect(recap.model).toBeNull();
  });
});

describe('listRelationshipRecaps', () => {
  it('liste les récaps pour un participant', async () => {
    fakeDb({});
    await expect(listRelationshipRecaps('c1', 'alice')).resolves.toEqual([{ id: 'rc1' }]);
  });

  it('refuse un non-participant', async () => {
    fakeDb({});
    await expect(listRelationshipRecaps('c1', 'eve')).rejects.toMatchObject({ code: 'NOT_A_PARTICIPANT' });
  });
});
