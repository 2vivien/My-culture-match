import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Chaîne drizzle factice : chaque méthode renvoie la chaîne, `await` résout `result`. */
function chain(result: unknown) {
  const calls: string[] = [];
  const proxy: unknown = new Proxy({}, {
    get(_t, prop: string) {
      if (prop === 'then') return (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => Promise.resolve(result).then(res, rej);
      if (prop === 'calls') return calls;
      return (...args: unknown[]) => { calls.push(prop); void args; return proxy; };
    },
  });
  return proxy as { calls: string[] };
}

const h = vi.hoisted(() => ({
  select: vi.fn(), insert: vi.fn(), delete: vi.fn(), createReport: vi.fn(),
}));
vi.mock('../../../src/infrastructure/database', () => {
  const table = (name: string, cols: string[]) => Object.fromEntries(cols.map((c) => [c, `${name}.${c}`]));
  return {
    db: { select: h.select, insert: h.insert, delete: h.delete },
    schema: {
      users: table('users', ['id', 'name', 'username', 'avatar']),
      blocks: table('blocks', ['blockerId', 'blockedId', 'createdAt']),
      userMutes: table('userMutes', ['userId', 'mutedUserId', 'createdAt']),
      moderationActions: table('moderationActions', ['id', 'targetUserId', 'createdAt']),
      moderationAppeals: table('moderationAppeals', ['id', 'userId', 'moderationActionId', 'status', 'createdAt']),
    },
  };
});
vi.mock('../../../src/modules/reports/reports.service', () => ({ createReport: h.createReport }));

import {
  blockUser, createAppeal, getMyModerationHistory, listBlockedUsers, listMutedUsers, muteUser, report,
  unblockUser, unmuteUser,
} from '../../../src/modules/safety/safety.service';

beforeEach(() => vi.clearAllMocks());

describe('blocage et sourdine', () => {
  it.each([
    ['blockUser', blockUser],
    ['unblockUser', unblockUser],
    ['muteUser', muteUser],
    ['unmuteUser', unmuteUser],
  ])('%s refuse de cibler son propre compte', async (_n, fn) => {
    await expect(fn('u1', 'u1')).rejects.toMatchObject({ status: 400, code: 'SELF_TARGET' });
    expect(h.select).not.toHaveBeenCalled();
  });

  it.each([
    ['blockUser', blockUser],
    ['muteUser', muteUser],
  ])('%s renvoie 404 pour un utilisateur inexistant', async (_n, fn) => {
    h.select.mockReturnValue(chain([]));
    await expect(fn('u1', 'ghost')).rejects.toMatchObject({ status: 404, code: 'USER_NOT_FOUND' });
    expect(h.insert).not.toHaveBeenCalled();
  });

  it('bloque un utilisateur de façon idempotente (ON CONFLICT DO NOTHING)', async () => {
    h.select.mockReturnValue(chain([{ id: 'u2' }]));
    const ins = chain(undefined);
    h.insert.mockReturnValue(ins);
    await expect(blockUser('u1', 'u2')).resolves.toEqual({ success: true, blocked: true });
    expect(ins.calls).toEqual(['values', 'onConflictDoNothing']);
  });

  it('débloque un utilisateur', async () => {
    h.select.mockReturnValue(chain([{ id: 'u2' }]));
    h.delete.mockReturnValue(chain(undefined));
    await expect(unblockUser('u1', 'u2')).resolves.toEqual({ success: true, blocked: false });
    expect(h.delete).toHaveBeenCalledTimes(1);
  });

  it('met en sourdine puis retire la sourdine', async () => {
    h.select.mockReturnValue(chain([{ id: 'u2' }]));
    h.insert.mockReturnValue(chain(undefined));
    h.delete.mockReturnValue(chain(undefined));
    await expect(muteUser('u1', 'u2')).resolves.toEqual({ success: true, muted: true });
    await expect(unmuteUser('u1', 'u2')).resolves.toEqual({ success: true, muted: false });
  });

  it('liste les utilisateurs bloqués et en sourdine', async () => {
    const users = [{ id: 'u2', name: 'Bob', username: 'bob', avatar: null, createdAt: new Date() }];
    h.select.mockReturnValueOnce(chain(users)).mockReturnValueOnce(chain([]));
    await expect(listBlockedUsers('u1')).resolves.toEqual({ users });
    await expect(listMutedUsers('u1')).resolves.toEqual({ users: [] });
  });
});

describe('signalement', () => {
  it('délègue la création du signalement au service dédié', async () => {
    h.createReport.mockResolvedValue({ id: 'r1', status: 'open' });
    const input = { targetType: 'user', targetId: 'u2', reason: 'spam' } as never;
    await expect(report('u1', input)).resolves.toEqual({ id: 'r1', status: 'open' });
    expect(h.createReport).toHaveBeenCalledWith('u1', input);
  });
});

describe('createAppeal', () => {
  it('exige une raison non vide', async () => {
    await expect(createAppeal('u1', 'a1', '   ')).rejects.toMatchObject({ code: 'APPEAL_REASON_REQUIRED' });
    expect(h.select).not.toHaveBeenCalled();
  });

  it('refuse un appel sur une sanction qui ne concerne pas l’utilisateur', async () => {
    h.select.mockReturnValue(chain([]));
    await expect(createAppeal('u1', 'a1', 'injuste')).rejects.toMatchObject({ status: 404, code: 'MODERATION_ACTION_NOT_FOUND' });
  });

  it('refuse un second appel tant que le premier est ouvert', async () => {
    h.select.mockReturnValueOnce(chain([{ id: 'a1' }])).mockReturnValueOnce(chain([{ id: 'ap1' }]));
    await expect(createAppeal('u1', 'a1', 'injuste')).rejects.toMatchObject({ status: 409, code: 'APPEAL_ALREADY_OPEN' });
    expect(h.insert).not.toHaveBeenCalled();
  });

  it('crée l’appel quand la sanction existe et qu’aucun appel n’est ouvert', async () => {
    h.select.mockReturnValueOnce(chain([{ id: 'a1' }])).mockReturnValueOnce(chain([]));
    h.insert.mockReturnValue(chain([{ id: 'ap9', reason: 'injuste' }]));
    await expect(createAppeal('u1', 'a1', 'injuste')).resolves.toEqual({ success: true, appeal: { id: 'ap9', reason: 'injuste' } });
  });
});

describe('getMyModerationHistory', () => {
  it('renvoie les sanctions et les appels de l’utilisateur', async () => {
    h.select.mockReturnValueOnce(chain([{ id: 'a1' }])).mockReturnValueOnce(chain([{ id: 'ap1' }]));
    await expect(getMyModerationHistory('u1')).resolves.toEqual({ actions: [{ id: 'a1' }], appeals: [{ id: 'ap1' }] });
  });
});
