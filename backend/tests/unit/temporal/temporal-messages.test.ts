import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Aplati un objet SQL de drizzle en texte pour router les réponses du mock. */
function sqlText(q: unknown): string {
  const chunks = (q as { queryChunks?: unknown[] }).queryChunks ?? [];
  return chunks.map((c) => (c && typeof c === 'object' && 'value' in c ? (c as { value: string[] }).value.join('') : '?')).join('');
}

const h = vi.hoisted(() => {
  const execute = vi.fn();
  const returning = vi.fn();
  const insertValues = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values: insertValues }));
  const where = vi.fn();
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  const selectWhere = vi.fn();
  const select = vi.fn(() => ({ from: () => ({ where: selectWhere }) }));
  return {
    execute, returning, insertValues, insert, where, set, update, select, selectWhere,
    emitToUser: vi.fn(), createNotification: vi.fn(), isParticipant: vi.fn(),
  };
});

vi.mock('../../../src/infrastructure/database', () => ({
  db: { execute: h.execute, insert: h.insert, update: h.update, select: h.select },
  schema: {
    conversationParticipants: { userId: 'cp.userId', conversationId: 'cp.conversationId', unreadCount: 'cp.unread' },
    conversations: { id: 'c.id', lastMessageAt: 'c.last' },
    messages: {},
  },
}));
vi.mock('../../../src/infrastructure/websocket', () => ({ emitToUser: h.emitToUser }));
vi.mock('../../../src/modules/notifications/notifications.service', () => ({ createNotification: h.createNotification }));
vi.mock('../../../src/modules/messages/conversation-access', () => ({ isConversationParticipant: h.isParticipant }));

import {
  cancelTemporalMessage, listTemporalMessages, revealDueTemporalMessages, scheduleTemporalMessage,
} from '../../../src/modules/temporal-messages/temporal-messages.service';

const future = () => new Date(Date.now() + 3600_000);
const row = (extra: Record<string, unknown> = {}) => ({
  id: 't1', conversation_id: 'c1', sender_id: 'alice', recipient_id: 'bob', type: 'text', text: 'surprise',
  media_url: null, audio_dur: null, file: null, reveal_at: '2030-01-01T10:00:00.000Z', revealed_at: null,
  cancelled_at: null, created_at: '2029-12-01T10:00:00.000Z', ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  h.isParticipant.mockResolvedValue(true);
  h.selectWhere.mockResolvedValue([{ userId: 'alice' }, { userId: 'bob' }]);
  h.where.mockResolvedValue(undefined);
  h.createNotification.mockResolvedValue(undefined);
});

describe('scheduleTemporalMessage', () => {
  const base = { conversationId: 'c1', senderId: 'alice', text: ' surprise ', revealAt: future() };

  it('refuse un non-participant', async () => {
    h.isParticipant.mockResolvedValue(false);
    await expect(scheduleTemporalMessage(base)).rejects.toMatchObject({ status: 403, code: 'NOT_A_PARTICIPANT' });
  });

  it('refuse une conversation de groupe', async () => {
    h.selectWhere.mockResolvedValue([{ userId: 'alice' }, { userId: 'bob' }, { userId: 'carl' }]);
    await expect(scheduleTemporalMessage(base)).rejects.toMatchObject({ code: 'TEMPORAL_TWO_PERSON_ONLY' });
  });

  it('refuse une conversation où il n’y a pas d’autre personne', async () => {
    h.selectWhere.mockResolvedValue([{ userId: 'alice' }, { userId: 'alice' }]);
    await expect(scheduleTemporalMessage(base)).rejects.toMatchObject({ code: 'TEMPORAL_RECIPIENT_NOT_FOUND' });
  });

  it('refuse une révélation à moins de 30 secondes ou dans le passé', async () => {
    await expect(scheduleTemporalMessage({ ...base, revealAt: new Date(Date.now() + 10_000) })).rejects.toMatchObject({ code: 'TEMPORAL_INVALID_DATE' });
    await expect(scheduleTemporalMessage({ ...base, revealAt: new Date(Date.now() - 1000) })).rejects.toMatchObject({ code: 'TEMPORAL_INVALID_DATE' });
    await expect(scheduleTemporalMessage({ ...base, revealAt: new Date('invalid') })).rejects.toMatchObject({ code: 'TEMPORAL_INVALID_DATE' });
  });

  it('refuse une révélation à plus de 10 ans', async () => {
    const tooFar = new Date(Date.now() + 11 * 365 * 24 * 3600_000);
    await expect(scheduleTemporalMessage({ ...base, revealAt: tooFar })).rejects.toMatchObject({ code: 'TEMPORAL_DATE_TOO_FAR' });
  });

  it('refuse un message vide sans média ni fichier', async () => {
    await expect(scheduleTemporalMessage({ ...base, text: '   ' })).rejects.toMatchObject({ code: 'TEMPORAL_EMPTY' });
    expect(h.execute).not.toHaveBeenCalled();
  });

  it('planifie, notifie le destinataire (verrouillé) et ne révèle pas le contenu', async () => {
    h.execute.mockResolvedValue([row()]);
    const dto = await scheduleTemporalMessage(base);
    expect(dto).toMatchObject({ id: 't1', senderId: 'alice', recipientId: 'bob', status: 'pending', text: 'surprise', revealedAt: null });
    expect(h.createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'bob', actorId: 'alice', action: 'temporal_pending',
      metadata: expect.objectContaining({ locked: true, temporalMessageId: expect.any(String) }),
    }));
    const [, event, payload] = h.emitToUser.mock.calls[0]!;
    expect(h.emitToUser.mock.calls[0]![0]).toBe('bob');
    expect(event).toBe('temporal-message:scheduled');
    expect(payload).toMatchObject({ conversationId: 'c1', locked: true });
    expect(payload).not.toHaveProperty('text');
  });

  it('accepte un média sans texte', async () => {
    h.execute.mockResolvedValue([row({ type: 'image', text: null, media_url: 'https://cdn/x.png' })]);
    const dto = await scheduleTemporalMessage({ ...base, text: null, type: 'image', mediaUrl: 'https://cdn/x.png' });
    expect(dto).toMatchObject({ type: 'image', text: null, mediaUrl: 'https://cdn/x.png' });
  });

  it('lève une erreur si l’insertion ne renvoie rien', async () => {
    h.execute.mockResolvedValue([]);
    await expect(scheduleTemporalMessage(base)).rejects.toMatchObject({ code: 'TEMPORAL_CREATE_FAILED' });
    expect(h.createNotification).not.toHaveBeenCalled();
  });
});

describe('listTemporalMessages', () => {
  it('renvoie les messages envoyés avec leur statut et le nombre de messages verrouillés reçus', async () => {
    h.execute.mockResolvedValueOnce([
      row(),
      row({ id: 't2', revealed_at: '2030-01-01T10:00:05.000Z' }),
      row({ id: 't3', cancelled_at: '2029-12-02T10:00:00.000Z', audio_dur: '12', file: { name: 'a.pdf' } }),
    ]);
    h.execute.mockResolvedValueOnce([{ count: 4 }]);
    const out = await listTemporalMessages('c1', 'alice');
    expect(out.sent.map((m) => m.status)).toEqual(['pending', 'revealed', 'cancelled']);
    expect(out.sent[1]!.revealedAt).toBe('2030-01-01T10:00:05.000Z');
    expect(out.sent[2]).toMatchObject({ audioDur: 12, file: { name: 'a.pdf' } });
    expect(out.lockedCount).toBe(4);
  });

  it('renvoie 0 verrouillé quand le comptage est vide', async () => {
    h.execute.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    expect(await listTemporalMessages('c1', 'alice')).toEqual({ sent: [], lockedCount: 0 });
  });

  it('refuse l’accès à un non-participant', async () => {
    h.isParticipant.mockResolvedValue(false);
    await expect(listTemporalMessages('c1', 'eve')).rejects.toMatchObject({ status: 403 });
  });
});

describe('cancelTemporalMessage', () => {
  it('annule un message en attente', async () => {
    h.execute.mockResolvedValue([{ id: 't1' }]);
    await expect(cancelTemporalMessage('c1', 'alice', 't1')).resolves.toEqual({ success: true });
    expect(sqlText(h.execute.mock.calls[0]![0])).toContain('cancelled_at = NOW()');
  });

  it('renvoie 404 si le message est introuvable, déjà révélé ou déjà annulé', async () => {
    h.execute.mockResolvedValue([]);
    await expect(cancelTemporalMessage('c1', 'alice', 'nope')).rejects.toMatchObject({ status: 404, code: 'TEMPORAL_NOT_FOUND' });
  });
});

describe('revealDueTemporalMessages', () => {
  const message = { id: 'm1', createdAt: new Date('2030-01-01T10:00:00Z'), conversationId: 'c1', senderId: 'alice' };

  it('ne fait rien quand rien n’est dû', async () => {
    h.execute.mockResolvedValueOnce([]);
    await expect(revealDueTemporalMessages()).resolves.toBe(0);
    expect(h.insert).not.toHaveBeenCalled();
  });

  it('révèle un message : insertion, compteur non lu, notifications et événements WebSocket', async () => {
    h.execute.mockImplementation(async (q: unknown) => {
      const t = sqlText(q);
      if (t.startsWith('SELECT * FROM temporal_messages WHERE reveal_at')) return [row()];
      if (t.includes('SET processing_at = NOW()')) return [row()];
      return [];
    });
    h.returning.mockResolvedValue([message]);
    await expect(revealDueTemporalMessages(10)).resolves.toBe(1);
    expect(h.insertValues).toHaveBeenCalledWith(expect.objectContaining({ conversationId: 'c1', senderId: 'alice', type: 'text', text: 'surprise' }));
    expect(h.update).toHaveBeenCalledTimes(2); // unread_count puis lastMessageAt
    expect(h.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 'bob', action: 'temporal_revealed' }));
    const events = h.emitToUser.mock.calls.map((c) => [c[0], c[1]]);
    expect(events).toEqual([['bob', 'message:new'], ['alice', 'temporal-message:revealed']]);
    expect(h.emitToUser.mock.calls[0]![2].message.createdAt).toBe('2030-01-01T10:00:00.000Z');
  });

  it('saute un message déjà pris en charge par un autre worker', async () => {
    h.execute.mockImplementation(async (q: unknown) => (sqlText(q).startsWith('SELECT * FROM temporal_messages WHERE reveal_at') ? [row()] : []));
    await expect(revealDueTemporalMessages()).resolves.toBe(0);
    expect(h.insert).not.toHaveBeenCalled();
  });

  it('libère le verrou de traitement et propage l’erreur si l’insertion échoue', async () => {
    const queries: string[] = [];
    h.execute.mockImplementation(async (q: unknown) => {
      const t = sqlText(q);
      queries.push(t);
      if (t.startsWith('SELECT * FROM temporal_messages WHERE reveal_at')) return [row()];
      if (t.includes('SET processing_at = NOW()')) return [row()];
      return [];
    });
    h.returning.mockResolvedValue([]);
    await expect(revealDueTemporalMessages()).rejects.toThrow('MESSAGE_REVEAL_INSERT_FAILED');
    expect(queries.some((t) => t.includes('SET processing_at = NULL WHERE id') && !t.includes('revealed_at = NOW()'))).toBe(true);
    expect(h.emitToUser).not.toHaveBeenCalled();
  });
});
