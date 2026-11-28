import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chain } from '../helpers/drizzle-fake';

const h = vi.hoisted(() => ({
  select: vi.fn(), insert: vi.fn(), update: vi.fn(),
  checkDatabase: vi.fn(), checkRedis: vi.fn(), zcard: vi.fn(),
  createNotification: vi.fn(), invalidateRoleCache: vi.fn(), revokeAllUserSessions: vi.fn(),
}));

// Schéma factice : n'importe quelle table/colonne existe (« table.colonne »).
vi.mock('../../../src/infrastructure/database', () => {
  const schema = new Proxy({}, {
    get: (_t, table: string) => new Proxy({}, { get: (_c, col: string) => `${table}.${col}` }),
  });
  return { db: { select: h.select, insert: h.insert, update: h.update }, schema, checkDatabase: h.checkDatabase };
});
vi.mock('../../../src/infrastructure/redis', () => ({ checkRedis: h.checkRedis, redis: { zcard: h.zcard } }));
vi.mock('../../../src/modules/notifications/notifications.service', () => ({ createNotification: h.createNotification }));
vi.mock('../../../src/modules/auth/require-admin', () => ({ invalidateRoleCache: h.invalidateRoleCache }));
vi.mock('../../../src/modules/auth/session.service', () => ({ revokeAllUserSessions: h.revokeAllUserSessions }));

import {
  banUser, getAdminStats, getAnalytics, getRecentActivity, getSystemHealth, listAdminUsers, listAuditLogs,
  listReports, logAudit, takeReportAction, unbanUser,
} from '../../../src/modules/admin/admin.service';

const meta = { ip: '1.2.3.4', userAgent: 'vitest' };
const iso = (d: string) => new Date(d);

beforeEach(() => {
  vi.clearAllMocks();
  h.createNotification.mockResolvedValue(undefined);
  h.invalidateRoleCache.mockResolvedValue(undefined);
  h.revokeAllUserSessions.mockResolvedValue(undefined);
  h.insert.mockReturnValue(chain(undefined));
  h.update.mockReturnValue(chain(undefined));
});

describe('logAudit', () => {
  it('enregistre qui, quoi, depuis quelle IP', async () => {
    const ins = chain(undefined);
    h.insert.mockReturnValue(ins);
    await logAudit('admin1', 'user.ban', { userId: 'u1' }, meta);
    expect(ins.args.values![0]).toEqual({ userId: 'admin1', action: 'user.ban', metadata: { userId: 'u1' }, ipAddress: '1.2.3.4', userAgent: 'vitest' });
  });
});

describe('takeReportAction', () => {
  const report = (targetType: string, targetId = 't1') => ({ id: 'r1', targetType, targetId });

  it('renvoie 404 pour un signalement inconnu', async () => {
    h.select.mockReturnValueOnce(chain([]));
    await expect(takeReportAction('r1', 'a1', 'warn', undefined, meta)).rejects.toMatchObject({ status: 404, code: 'REPORT_NOT_FOUND' });
  });

  it('classe un signalement sans sanction (dismiss) même si la cible a disparu', async () => {
    const upd = chain(undefined);
    h.select.mockReturnValueOnce(chain([report('post')])).mockReturnValueOnce(chain([]));
    h.update.mockReturnValue(upd);
    const out = await takeReportAction('r1', 'a1', 'dismiss', 'sans objet', meta);
    expect(out).toEqual({ id: 'r1', status: 'dismissed', resolution: 'sans objet' });
    expect(upd.args.set![0]).toMatchObject({ status: 'dismissed', moderatorId: 'a1', resolution: 'sans objet' });
    expect(h.createNotification).not.toHaveBeenCalled();
  });

  it('refuse d’agir quand la cible est introuvable', async () => {
    h.select.mockReturnValueOnce(chain([report('post')])).mockReturnValueOnce(chain([]));
    await expect(takeReportAction('r1', 'a1', 'warn', undefined, meta)).rejects.toMatchObject({ status: 400, code: 'REPORT_TARGET_MISSING' });
    expect(h.createNotification).not.toHaveBeenCalled();
  });

  it.each([
    ['post', { authorId: 'author' }, 'author'],
    ['comment', { userId: 'commenter' }, 'commenter'],
    ['place', { createdById: 'creator' }, 'creator'],
    ['message', { senderId: 'sender' }, 'sender'],
  ])('avertit l’auteur d’un %s signalé', async (type, row, expected) => {
    h.select.mockReturnValueOnce(chain([report(type, 'cible')])).mockReturnValueOnce(chain([row]));
    const out = await takeReportAction('r1', 'a1', 'warn', undefined, meta);
    expect(out).toEqual({ id: 'r1', status: 'actioned', resolution: 'warn par la modération' });
    expect(h.createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: expected, actorId: 'a1', action: 'moderation.warn', target: 'cible', metadata: { reason: 'warn par la modération', reportId: 'r1' },
    }));
  });

  it('cible directement l’utilisateur pour un signalement de type user, sans requête supplémentaire', async () => {
    h.select.mockReturnValueOnce(chain([report('user', 'victim')]));
    await takeReportAction('r1', 'a1', 'warn', 'attention', meta);
    expect(h.select).toHaveBeenCalledTimes(1);
    expect(h.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 'victim' }));
  });

  it('suspend 7 jours, invalide le cache de rôle et prévient la personne', async () => {
    const sets: Array<Record<string, unknown>> = [];
    h.update.mockImplementation(() => ({ set: (v: Record<string, unknown>) => { sets.push(v); return chain(undefined); } }));
    h.select.mockReturnValueOnce(chain([report('user', 'victim')]));
    const before = Date.now();
    await takeReportAction('r1', 'a1', 'suspend', undefined, meta);
    const locked = (sets[0]!.lockedUntil as Date).getTime();
    expect(locked - before).toBeGreaterThanOrEqual(7 * 86_400_000 - 1000);
    expect(locked - before).toBeLessThan(7 * 86_400_000 + 5000);
    expect(sets[1]).toMatchObject({ status: 'actioned', moderatorId: 'a1' });
    expect(h.invalidateRoleCache).toHaveBeenCalledWith('victim');
    expect(h.createNotification).toHaveBeenCalledWith(expect.objectContaining({ action: 'moderation.suspend', metadata: { reason: 'suspend par la modération', days: 7, reportId: 'r1' } }));
  });

  it('bannit via banUser (sessions révoquées) puis clôt le signalement', async () => {
    h.select
      .mockReturnValueOnce(chain([report('user', 'victim')]))
      .mockReturnValueOnce(chain([{ id: 'victim', role: 'user' }]));
    const out = await takeReportAction('r1', 'a1', 'ban', 'harcèlement', meta);
    expect(out.status).toBe('actioned');
    expect(h.revokeAllUserSessions).toHaveBeenCalledWith('victim');
    expect(h.createNotification).toHaveBeenCalledWith(expect.objectContaining({ action: 'moderation.ban', metadata: { reason: 'harcèlement' } }));
  });

  it('journalise l’action dans l’audit', async () => {
    const ins = chain(undefined);
    h.insert.mockReturnValue(ins);
    h.select.mockReturnValueOnce(chain([report('user', 'victim')]));
    await takeReportAction('r1', 'a1', 'warn', 'motif', meta);
    expect(ins.args.values![0]).toMatchObject({ action: 'report.warn', metadata: { reportId: 'r1', targetType: 'user', targetId: 'victim', reason: 'motif' } });
  });
});

describe('banUser / unbanUser', () => {
  it('refuse de bannir un utilisateur inconnu', async () => {
    h.select.mockReturnValueOnce(chain([]));
    await expect(banUser('x', 'a1', 'motif', undefined, meta)).rejects.toMatchObject({ status: 404, code: 'USER_NOT_FOUND' });
  });

  it('protège les superadmins', async () => {
    h.select.mockReturnValueOnce(chain([{ id: 'sa', role: 'superadmin' }]));
    await expect(banUser('sa', 'a1', 'motif', undefined, meta)).rejects.toMatchObject({ status: 403, code: 'ADMIN_PROTECTED' });
    expect(h.update).not.toHaveBeenCalled();
    expect(h.revokeAllUserSessions).not.toHaveBeenCalled();
  });

  it('banne, révoque les sessions, notifie et journalise', async () => {
    const upd = chain(undefined);
    const ins = chain(undefined);
    h.update.mockReturnValue(upd);
    h.insert.mockReturnValue(ins);
    h.select.mockReturnValueOnce(chain([{ id: 'u1', role: 'user' }]));
    await expect(banUser('u1', 'a1', 'spam', undefined, meta)).resolves.toEqual({ id: 'u1', banned: true });
    expect(upd.args.set![0]).toMatchObject({ banReason: 'spam' });
    expect(h.invalidateRoleCache).toHaveBeenCalledWith('u1');
    expect(h.revokeAllUserSessions).toHaveBeenCalledWith('u1');
    expect(ins.args.values![0]).toMatchObject({ action: 'user.ban', metadata: { userId: 'u1', reason: 'spam' } });
  });

  it('rétablit un compte : lève bannissement et suspension', async () => {
    const upd = chain(undefined);
    const ins = chain(undefined);
    h.update.mockReturnValue(upd);
    h.insert.mockReturnValue(ins);
    h.select.mockReturnValueOnce(chain([{ id: 'u1' }]));
    await expect(unbanUser('u1', 'a1', undefined, meta)).resolves.toEqual({ id: 'u1', banned: false });
    expect(upd.args.set![0]).toMatchObject({ bannedAt: null, banReason: null, lockedUntil: null });
    expect(ins.args.values![0]).toMatchObject({ action: 'user.unban', metadata: { userId: 'u1', reason: 'Rétablissement' } });
  });

  it('refuse de rétablir un utilisateur inconnu', async () => {
    h.select.mockReturnValueOnce(chain([]));
    await expect(unbanUser('x', 'a1', 'ok', meta)).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
  });
});

describe('listes paginées', () => {
  const rows = (n: number) => Array.from({ length: n }, (_v, i) => ({
    id: `r${i}`, createdAt: iso(`2026-01-0${i + 1}T00:00:00Z`), bannedAt: i === 0 ? iso('2026-02-01T00:00:00Z') : null, lockedUntil: null,
  }));

  it('listReports renvoie la page et le curseur quand il y a une page suivante', async () => {
    h.select.mockReturnValueOnce(chain(rows(3)));
    const out = await listReports({ limit: 2 });
    expect(out.reports).toHaveLength(2);
    expect(out.nextCursor).toBe('2026-01-02T00:00:00.000Z');
    expect(out.reports[0]!.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('listReports sans page suivante n’a pas de curseur et accepte filtre + curseur', async () => {
    const q = chain(rows(1));
    h.select.mockReturnValueOnce(q);
    const out = await listReports({ status: 'open', cursor: '2026-01-01T00:00:00Z', limit: 5 });
    expect(out.nextCursor).toBeNull();
    expect(q.args.limit).toEqual([6]);
  });

  it('listAdminUsers sérialise les dates et gère les filtres de statut', async () => {
    for (const status of ['banned', 'suspended', 'active', undefined]) {
      h.select.mockReturnValueOnce(chain(rows(2)));
      const out = await listAdminUsers({ search: 'ali', status, cursor: '2026-01-01T00:00:00Z', limit: 5 });
      expect(out.users[0]).toMatchObject({ bannedAt: '2026-02-01T00:00:00.000Z', lockedUntil: null });
      expect(out.users[1]!.bannedAt).toBeNull();
      expect(out.nextCursor).toBeNull();
    }
  });

  it('listAdminUsers pagine avec un curseur', async () => {
    h.select.mockReturnValueOnce(chain(rows(3)));
    const out = await listAdminUsers({ limit: 2 });
    expect(out.users).toHaveLength(2);
    expect(out.nextCursor).toBe('2026-01-02T00:00:00.000Z');
  });

  it('listAuditLogs pagine et sérialise', async () => {
    h.select.mockReturnValueOnce(chain(rows(3)));
    const out = await listAuditLogs({ limit: 2, cursor: '2025-12-31T00:00:00Z' });
    expect(out.logs).toHaveLength(2);
    expect(out.nextCursor).toBe('2026-01-02T00:00:00.000Z');
    h.select.mockReturnValueOnce(chain([]));
    expect(await listAuditLogs({})).toEqual({ logs: [], nextCursor: null });
  });
});

describe('getAdminStats', () => {
  it('assemble les 7 compteurs du tableau de bord', async () => {
    for (const n of [10, 4, 3, 2, 1, 5, 99]) h.select.mockReturnValueOnce(chain([{ count: n }]));
    await expect(getAdminStats()).resolves.toEqual({
      totalUsers: 10, activeUsers24h: 4, newPosts24h: 3, flaggedPosts: 2, openReports: 1, totalMatches: 5, messages24h: 99,
    });
  });
});

describe('getAnalytics', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-06-15T12:00:00Z') }));
  afterEach(() => vi.useRealTimers());

  const queue = (parts: { users?: unknown[]; posts?: unknown[]; msgs?: unknown[]; growthU?: unknown[]; growthT?: unknown[]; reports?: unknown[]; scores?: unknown[]; engagement?: unknown[] }) => {
    h.select
      .mockReturnValueOnce(chain(parts.users ?? []))
      .mockReturnValueOnce(chain(parts.posts ?? []))
      .mockReturnValueOnce(chain(parts.msgs ?? []))
      .mockReturnValueOnce(chain(parts.growthU ?? []))
      .mockReturnValueOnce(chain(parts.growthT ?? []))
      .mockReturnValueOnce(chain(parts.reports ?? []))
      .mockReturnValueOnce(chain(parts.scores ?? []))
      .mockReturnValueOnce(chain(parts.engagement ?? []));
  };

  it.each([['7d', 8], ['30d', 31], ['90d', 91], ['12m', 13]] as const)('génère un point par jour (ou par mois) sur %s : %i points', async (period, points) => {
    queue({});
    const out = await getAnalytics(period);
    expect(out.activity).toHaveLength(points);
    expect(out.growth).toHaveLength(12);
    expect(out.engagement).toHaveLength(24);
    expect(out.scoreDistribution.map((s) => s.range)).toEqual(['0-20', '20-40', '40-60', '60-80', '80-100']);
  });

  it('place les compteurs sur le bon jour et met 0 ailleurs', async () => {
    queue({
      users: [{ day: '2026-06-15 00:00:00+00', count: 5 }],
      posts: [{ day: '2026-06-14 00:00:00+00', count: 2 }],
      msgs: [{ day: '2026-06-15 00:00:00+00', count: 40 }],
    });
    const { activity } = await getAnalytics('7d');
    const last = activity.at(-1)!;
    expect(last).toMatchObject({ utilisateurs: 5, posts: 0, messages: 40 });
    expect(activity.at(-2)).toMatchObject({ utilisateurs: 0, posts: 2, messages: 0 });
    expect(activity[0]).toMatchObject({ utilisateurs: 0, posts: 0, messages: 0 });
  });

  it('agrège par mois sur 12 mois', async () => {
    queue({ users: [{ day: '2026-06-01 00:00:00+00', count: 9 }] });
    const { activity } = await getAnalytics('12m');
    expect(activity.reduce((n, a) => n + a.utilisateurs, 0)).toBe(9);
  });

  it('calcule croissance, répartition des signalements, scores et engagement', async () => {
    queue({
      growthU: [{ month: '2026-06', count: 7 }],
      growthT: [{ month: '2026-06', count: 3 }],
      reports: [{ reason: 'spam', count: 4 }, { reason: 'harassment', count: 2 }, { reason: 'inconnu', count: 1 }, { reason: null, count: 1 }],
      scores: [{ range: '80-100', count: 6 }, { range: '0-20', count: 1 }],
      engagement: [{ hour: 14, likes: 10, comments: 3, shares: 1 }],
    });
    const out = await getAnalytics('30d');
    expect(out.growth.at(-1)).toMatchObject({ utilisateurs: 7, tribus: 3 });
    expect(out.reportDistribution).toEqual([
      { name: 'Spam', value: 4, color: '#f59e0b' },
      { name: 'Harcèlement', value: 2, color: '#ef4444' },
      { name: 'inconnu', value: 1, color: '#8b5cf6' },
      { name: 'Autre', value: 1, color: '#ec4899' },
    ]);
    expect(out.scoreDistribution).toEqual([
      { range: '0-20', count: 1 }, { range: '20-40', count: 0 }, { range: '40-60', count: 0 }, { range: '60-80', count: 0 }, { range: '80-100', count: 6 },
    ]);
    expect(out.engagement[14]).toEqual({ hour: '14h', likes: 10, comments: 3, shares: 1 });
    expect(out.engagement[3]).toEqual({ hour: '03h', likes: 0, comments: 0, shares: 0 });
  });
});

describe('getRecentActivity', () => {
  it('fusionne inscriptions, posts, signalements et audit, du plus récent au plus ancien', async () => {
    h.select
      .mockReturnValueOnce(chain([{ id: 'u1', name: 'Alice', createdAt: iso('2026-06-01T10:00:00Z') }]))
      .mockReturnValueOnce(chain([{ id: 'p1', authorName: 'Bob', createdAt: iso('2026-06-01T12:00:00Z') }]))
      .mockReturnValueOnce(chain([{ id: 'r1', reason: null, createdAt: iso('2026-06-01T11:00:00Z') }]))
      .mockReturnValueOnce(chain([
        { id: 'l1', userId: 'a1', action: 'user.ban', createdAt: iso('2026-06-01T09:00:00Z') },
        { id: 'l2', userId: 'a1', action: 'user.unlock', createdAt: iso('2026-06-01T08:00:00Z') },
      ]));
    const events = await getRecentActivity({});
    expect(events.map((e) => e.id)).toEqual(['post_created_p1', 'report_r1', 'user_register_u1', 'log_l1', 'log_l2']);
    expect(events[1]!.details).toBe('Nouveau signalement : autre');
    expect(events[3]!.type).toBe('ban');
    expect(events[4]!.type).toBe('login');
    expect(events[2]!.details).toBe('Alice a rejoint la plateforme');
  });

  it('respecte la limite demandée', async () => {
    const many = Array.from({ length: 5 }, (_v, i) => ({ id: `u${i}`, name: `N${i}`, createdAt: iso(`2026-06-0${i + 1}T00:00:00Z`) }));
    h.select.mockReturnValueOnce(chain(many)).mockReturnValueOnce(chain([])).mockReturnValueOnce(chain([])).mockReturnValueOnce(chain([]));
    expect(await getRecentActivity({ limit: 2 })).toHaveLength(2);
  });
});

describe('getSystemHealth', () => {
  it('renvoie « healthy » avec les latences mesurées', async () => {
    h.checkDatabase.mockResolvedValue(undefined);
    h.checkRedis.mockResolvedValue(undefined);
    h.select.mockReturnValueOnce(chain([{ count: 12 }]));
    h.zcard.mockResolvedValue(3);
    const out = await getSystemHealth();
    expect(out).toMatchObject({ status: 'healthy', activeConnections: 12, queueDepth: 3 });
    expect(out.dbLatency).toBeGreaterThanOrEqual(0);
    expect(out.redisLatency).toBeGreaterThanOrEqual(0);
    expect(out.memoryUsage as number).toBeGreaterThan(0);
    expect(out.memoryUsage as number).toBeLessThanOrEqual(100);
  });

  it('passe en « degraded » (latence -1) quand la base ou Redis ne répondent pas', async () => {
    h.checkDatabase.mockRejectedValue(new Error('down'));
    h.checkRedis.mockRejectedValue(new Error('down'));
    h.select.mockReturnValueOnce(chain(Promise.reject(new Error('pg'))));
    h.zcard.mockRejectedValue(new Error('redis'));
    const out = await getSystemHealth();
    expect(out).toMatchObject({ status: 'degraded', dbLatency: -1, redisLatency: -1, activeConnections: 0, queueDepth: 0 });
  });
});
