import { beforeEach, describe, expect, it, vi } from 'vitest';

function sqlText(q: unknown): string {
  const chunks = (q as { queryChunks?: unknown[] }).queryChunks ?? [];
  return chunks.map((c) => (c && typeof c === 'object' && 'value' in c ? (c as { value: string[] }).value.join('') : '?')).join('');
}

const h = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock('../../../src/infrastructure/database', () => ({ db: { execute: h.execute } }));

import {
  createRelationshipCapsule, getRelationshipTimeline, rebuildRelationshipMemory, refreshAfterMessage,
} from '../../../src/modules/relationship-memory/relationship-memory.service';

type Msg = { id: string; senderId: string; text: string | null; type: string; createdAt: Date };
const t0 = Date.UTC(2026, 2, 1, 9);
const MIN = 60_000;
const msg = (id: string, senderId: string, text: string | null, minutes: number, type = 'text'): Msg =>
  ({ id, senderId, text, type, createdAt: new Date(t0 + minutes * MIN) });

function fakeDb(opts: { participants?: string[]; isLove?: boolean; messages?: Msg[] }) {
  const writes: string[] = [];
  h.execute.mockImplementation(async (q: unknown) => {
    const t = sqlText(q);
    if (t.includes('FROM conversation_participants')) return (opts.participants ?? ['alice', 'bob']).map((userId) => ({ userId }));
    if (t.includes('FROM love_matches')) return [{ isLove: opts.isLove ?? false }];
    if (t.includes('FROM messages')) return opts.messages ?? [];
    if (/^\s*SELECT/.test(t) && t.includes('FROM relationship_memories')) return [{ id: 'mem1' }];
    if (t.includes('FROM relationship_capsules')) return [{ id: 'cap1' }];
    writes.push(t);
    return [];
  });
  return writes;
}

beforeEach(() => vi.clearAllMocks());

describe('rebuildRelationshipMemory', () => {
  it('refuse un non-participant', async () => {
    fakeDb({});
    await expect(rebuildRelationshipMemory('c1', 'eve')).rejects.toMatchObject({ status: 403, code: 'NOT_A_PARTICIPANT' });
  });

  it('ne produit rien (et n’écrit rien) pour une conversation vide', async () => {
    const writes = fakeDb({ messages: [] });
    await expect(rebuildRelationshipMemory('c1', 'alice')).resolves.toEqual({ relationshipType: 'friendship', memories: [], messageCount: 0 });
    expect(writes).toEqual([]);
  });

  it('crée « Premier message » et « Première réponse » avec le bon acteur', async () => {
    fakeDb({ messages: [msg('m1', 'bob', 'Salut', 0), msg('m2', 'alice', 'Coucou', 5)] });
    const { memories } = await rebuildRelationshipMemory('c1', 'alice');
    const first = memories.find((m) => m.title === 'Premier message')!;
    expect(first).toMatchObject({ actorUserId: 'bob', evidence: ['m1'], kind: 'first' });
    expect(first.summary).toContain('ton interlocuteur');
    const reply = memories.find((m) => m.title === 'Première réponse')!;
    expect(reply).toMatchObject({ actorUserId: 'alice', evidence: ['m1', 'm2'] });
  });

  it('n’invente pas de « première réponse » quand une seule personne a écrit', async () => {
    fakeDb({ messages: [msg('m1', 'alice', 'Allô ?', 0), msg('m2', 'alice', 'Tu es là ?', 3)] });
    const { memories } = await rebuildRelationshipMemory('c1', 'alice');
    expect(memories.some((m) => m.title === 'Première réponse')).toBe(false);
    expect(memories.find((m) => m.title === 'Premier message')!.summary).toContain('toi');
  });

  it('repère le premier média, le message long et le plus développé', async () => {
    const long = 'x'.repeat(320);
    fakeDb({ messages: [msg('m1', 'alice', 'Hello', 0), msg('m2', 'bob', null, 1, 'image'), msg('m3', 'bob', long, 2)] });
    const { memories } = await rebuildRelationshipMemory('c1', 'alice');
    expect(memories.find((m) => m.kind === 'media')).toMatchObject({ evidence: ['m2'], metadata: { mediaType: 'image' } });
    expect(memories.find((m) => m.title === 'Première grande conversation')).toMatchObject({ evidence: ['m3'], metadata: { characters: 320 } });
    expect(memories.find((m) => m.title === 'Message le plus développé')).toMatchObject({ evidence: ['m3'] });
  });

  it('ne signale pas de message développé sous 300 caractères', async () => {
    fakeDb({ messages: [msg('m1', 'alice', 'x'.repeat(260), 0), msg('m2', 'bob', 'ok', 1)] });
    const { memories } = await rebuildRelationshipMemory('c1', 'alice');
    expect(memories.some((m) => m.title === 'Première grande conversation')).toBe(false);
    expect(memories.some((m) => m.title === 'Message le plus développé')).toBe(true);
  });

  it('détecte les sujets récurrents (au moins deux termes) et exclut les mots vides', async () => {
    fakeDb({
      messages: [
        msg('m1', 'alice', 'Randonnée montagne ce week-end ?', 0),
        msg('m2', 'bob', 'Oui randonnée montagne samedi', 1),
        msg('m3', 'alice', 'Parfait pour la randonnée', 2),
      ],
    });
    const { memories } = await rebuildRelationshipMemory('c1', 'alice');
    const topics = memories.find((m) => m.kind === 'shared_interest')!;
    expect((topics.metadata as { terms: string[] }).terms).toEqual(expect.arrayContaining(['randonnee', 'montagne']));
    expect((topics.metadata as { terms: string[] }).terms).not.toContain('pour');
  });

  it('détecte une journée très active et une conversation intense', async () => {
    const burst = Array.from({ length: 10 }, (_v, i) => msg(`b${i}`, i % 2 ? 'bob' : 'alice', `message ${i}`, i * 5));
    fakeDb({ messages: burst });
    const { memories } = await rebuildRelationshipMemory('c1', 'alice');
    expect(memories.find((m) => m.title === 'Votre journée la plus active')).toMatchObject({ metadata: { messageCount: 10 } });
    const intense = memories.find((m) => m.title === 'Une conversation particulièrement intense')!;
    expect(intense.kind).toBe('turning_point');
    expect(intense.metadata).toMatchObject({ messages: 10, durationMinutes: 45 });
  });

  it('une rafale étalée sur plus de 2h n’est pas une conversation intense', async () => {
    const spread = Array.from({ length: 10 }, (_v, i) => msg(`s${i}`, 'alice', `message ${i}`, i * 30));
    fakeDb({ messages: spread });
    const { memories } = await rebuildRelationshipMemory('c1', 'alice');
    expect(memories.some((m) => m.title === 'Une conversation particulièrement intense')).toBe(false);
  });

  it('signale un moment positif à partir de 6 signaux lexicaux, sans en tirer de responsabilité', async () => {
    fakeDb({ messages: [msg('m1', 'alice', 'merci adore magnifique génial', 0), msg('m2', 'bob', 'superbe parfait bravo', 1)] });
    const { memories } = await rebuildRelationshipMemory('c1', 'alice');
    expect(memories.find((m) => m.kind === 'positive')).toMatchObject({ metadata: { positiveSignals: 7 } });
  });

  it('signale un moment difficile à partir de 5 marqueurs de tension, sans désigner de coupable', async () => {
    fakeDb({ messages: [msg('m1', 'alice', 'désolé pardon dispute', 0), msg('m2', 'bob', 'triste silence problème', 1)] });
    const { memories } = await rebuildRelationshipMemory('c1', 'alice');
    const tension = memories.find((m) => m.kind === 'tension')!;
    expect(tension.metadata).toMatchObject({ tensionSignals: 6 });
    expect(tension.summary).toContain('ne détermine pas la cause ni la responsabilité');
  });

  it('un échange déséquilibré (ratio < 0,35) n’est pas qualifié de réciproque', async () => {
    const lots = Array.from({ length: 9 }, (_v, i) => msg(`a${i}`, 'alice', 'bonjour', i * 200));
    fakeDb({ messages: [...lots, msg('b1', 'bob', 'salut', 2000)] });
    const { memories } = await rebuildRelationshipMemory('c1', 'alice');
    expect(memories.some((m) => m.title === 'Un échange réciproque')).toBe(false);
  });

  it('un échange équilibré est qualifié de réciproque', async () => {
    fakeDb({ messages: [msg('m1', 'alice', 'salut', 0), msg('m2', 'bob', 'coucou', 1), msg('m3', 'alice', 'bien ?', 2), msg('m4', 'bob', 'oui', 3)] });
    const { memories } = await rebuildRelationshipMemory('c1', 'alice');
    expect(memories.find((m) => m.title === 'Un échange réciproque')).toMatchObject({ metadata: { participationRatio: 1 } });
  });

  it('remplace les souvenirs précédents, les insère triés par importance et met à jour le run', async () => {
    const writes = fakeDb({ isLove: true, messages: [msg('m1', 'alice', 'salut', 0), msg('m2', 'bob', 'coucou', 1)] });
    const { memories, relationshipType, messageCount } = await rebuildRelationshipMemory('c1', 'alice');
    expect(relationshipType).toBe('love');
    expect(messageCount).toBe(2);
    expect(writes[0]!.trim()).toMatch(/^DELETE FROM relationship_memories/);
    expect(writes.filter((w) => w.includes('INSERT INTO relationship_memories'))).toHaveLength(memories.length);
    expect(writes.at(-1)).toContain('INSERT INTO relationship_memory_runs');
    const importances = memories.map((m) => m.importance);
    expect(importances).toEqual([...importances].sort((a, b) => b - a));
  });
});

describe('getRelationshipTimeline', () => {
  it('renvoie souvenirs et capsules pour un participant', async () => {
    fakeDb({ isLove: true });
    await expect(getRelationshipTimeline('c1', 'alice')).resolves.toEqual({
      relationshipType: 'love', memories: [{ id: 'mem1' }], capsules: [{ id: 'cap1' }],
    });
  });

  it('refuse un non-participant', async () => {
    fakeDb({});
    await expect(getRelationshipTimeline('c1', 'eve')).rejects.toMatchObject({ code: 'NOT_A_PARTICIPANT' });
  });
});

describe('createRelationshipCapsule', () => {
  it('refuse une capsule sans note ni média', async () => {
    const writes = fakeDb({});
    await expect(createRelationshipCapsule({ conversationId: 'c1', userId: 'alice', body: '  ' })).rejects.toMatchObject({ status: 400, code: 'EMPTY_CAPSULE' });
    expect(writes).toEqual([]);
  });

  it('crée une capsule avec une note seule', async () => {
    const writes = fakeDb({ isLove: true });
    const out = await createRelationshipCapsule({ conversationId: 'c1', userId: 'alice', body: ' notre premier café ', title: ' Café ' });
    expect(out).toMatchObject({ relationshipType: 'love' });
    expect(out.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(writes).toHaveLength(1);
    expect(writes[0]).toContain('INSERT INTO relationship_capsules');
  });

  it('crée une capsule avec un média seul', async () => {
    const writes = fakeDb({});
    await createRelationshipCapsule({ conversationId: 'c1', userId: 'bob', mediaUrls: ['https://cdn/x.jpg'], eventDate: '2026-02-14' });
    expect(writes).toHaveLength(1);
  });

  it('refuse un non-participant', async () => {
    fakeDb({});
    await expect(createRelationshipCapsule({ conversationId: 'c1', userId: 'eve', body: 'x' })).rejects.toMatchObject({ status: 403 });
  });
});

describe('refreshAfterMessage', () => {
  it('reconstruit la mémoire de la conversation', async () => {
    const writes = fakeDb({ messages: [msg('m1', 'alice', 'salut', 0)] });
    await refreshAfterMessage('c1', 'alice');
    expect(writes.some((w) => w.includes('INSERT INTO relationship_memory_runs'))).toBe(true);
  });

  it('n’échoue jamais : l’envoi du message ne doit pas être bloqué', async () => {
    h.execute.mockRejectedValue(new Error('db down'));
    await expect(refreshAfterMessage('c1', 'alice')).resolves.toBeUndefined();
  });
});
