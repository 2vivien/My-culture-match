import { api, USE_MOCK } from './api';

// ── Types ──────────────────────────────────────────────────

export type ReportAction = 'warn' | 'suspend' | 'ban' | 'dismiss';
export type ReportStatus = 'open' | 'reviewed' | 'dismissed' | 'actioned';
export type UserStatusFilter = 'active' | 'suspended' | 'banned';

export interface AdminStats {
  totalUsers: number;
  activeUsers24h: number;
  newPosts24h: number;
  flaggedPosts: number;
  openReports: number;
  totalMatches: number;
  messages24h: number;
  totalTribes?: number;
  totalPosts?: number;
  totalStories?: number;
  avgMatchScore?: number;
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'user' | 'post' | 'comment' | 'message';
  targetId: string;
  reason: string | null;
  description: string | null;
  status: ReportStatus;
  moderatorId: string | null;
  resolution: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  avatar: string | null;
  profileCompleted: boolean;
  bannedAt: string | null;
  banReason: string | null;
  lockedUntil: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  dbLatency: number;
  redisLatency: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  activeConnections: number;
  queueDepth: number;
}

export interface ActivityEvent {
  id: string;
  type: 'user_register' | 'post_created' | 'tribe_joined' | 'match' | 'report' | 'ban' | 'login';
  userId: string;
  userName: string;
  details: string;
  createdAt: string;
}

export interface AnalyticsData {
  activity: Array<{ label: string; utilisateurs: number; posts: number; messages: number }>;
  growth: Array<{ month: string; utilisateurs: number; tribus: number }>;
  reportDistribution: Array<{ name: string; value: number; color: string }>;
  scoreDistribution: Array<{ range: string; count: number }>;
  engagement: Array<{ hour: string; likes: number; comments: number; shares: number }>;
}

// ── Mock data ──────────────────────────────────────────────

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function hoursAgo(h: number) { return new Date(Date.now() - h * 3600000).toISOString(); }

const now = new Date().toISOString();

const MOCK_STATS: AdminStats = {
  totalUsers: 12847, activeUsers24h: 3421, newPosts24h: 567,
  flaggedPosts: 12, openReports: 8, totalMatches: 2156,
  messages24h: 18934, totalTribes: 342, totalPosts: 89456,
  totalStories: 4521, avgMatchScore: 87,
};

const MOCK_REPORTS: AdminReport[] = [
  { id: 'r1', reporterId: 'u1', reporterName: 'Amal', targetType: 'post', targetId: 'p1', reason: 'spam', description: 'Contenu répétitif promotionnel', status: 'open', moderatorId: null, resolution: null, createdAt: hoursAgo(1) },
  { id: 'r2', reporterId: 'u2', reporterName: 'Keisuke', targetType: 'user', targetId: 'u5', reason: 'harassment', description: 'Messages offensants dans les DMs', status: 'open', moderatorId: null, resolution: null, createdAt: hoursAgo(3) },
  { id: 'r3', reporterId: 'u3', reporterName: 'Jumana', targetType: 'comment', targetId: 'c12', reason: 'hate_speech', description: 'Discours discriminatoire', status: 'reviewed', moderatorId: 'admin1', resolution: 'En attente de révision', createdAt: hoursAgo(6) },
  { id: 'r4', reporterId: 'u4', reporterName: 'Kaelen', targetType: 'post', targetId: 'p45', reason: 'nsfw', description: 'Contenu inapproprié', status: 'actioned', moderatorId: 'admin1', resolution: 'Post supprimé, auteur averti', createdAt: hoursAgo(12) },
  { id: 'r5', reporterId: 'u6', reporterName: 'Nala', targetType: 'message', targetId: 'm9', reason: 'spam', description: 'Spam en masse dans les conversations', status: 'dismissed', moderatorId: 'admin1', resolution: 'Faux positif', createdAt: hoursAgo(24) },
];

const MOCK_USERS: AdminUser[] = [
  { id: 'u1', name: 'Amal Kodjo', username: 'amal', email: 'amal@culture.com', role: 'user', avatar: null, profileCompleted: true, bannedAt: null, banReason: null, lockedUntil: null, createdAt: hoursAgo(720) },
  { id: 'u2', name: 'Keisuke Tanaka', username: 'keisuke', email: 'keisuke@culture.com', role: 'user', avatar: null, profileCompleted: true, bannedAt: null, banReason: null, lockedUntil: null, createdAt: hoursAgo(600) },
  { id: 'u3', name: 'Jumana Al-Rashid', username: 'jumana', email: 'jumana@culture.com', role: 'admin', avatar: null, profileCompleted: true, bannedAt: null, banReason: null, lockedUntil: null, createdAt: hoursAgo(500) },
  { id: 'u4', name: 'Kaelen Nordström', username: 'kaelen', email: 'kaelen@culture.com', role: 'user', avatar: null, profileCompleted: true, bannedAt: null, banReason: null, lockedUntil: null, createdAt: hoursAgo(400) },
  { id: 'u5', name: 'Nala Mwangi', username: 'nala', email: 'nala@culture.com', role: 'user', avatar: null, profileCompleted: false, bannedAt: hoursAgo(2), banReason: 'Comportement répété', lockedUntil: null, createdAt: hoursAgo(300) },
  { id: 'u6', name: 'Carlos Rivera', username: 'carlos', email: 'carlos@culture.com', role: 'moderator', avatar: null, profileCompleted: true, bannedAt: null, banReason: null, lockedUntil: null, createdAt: hoursAgo(200) },
  { id: 'u7', name: 'Yuki Sato', username: 'yuki', email: 'yuki@culture.com', role: 'user', avatar: null, profileCompleted: true, bannedAt: null, banReason: null, lockedUntil: null, createdAt: hoursAgo(150) },
  { id: 'u8', name: 'Fatima Bello', username: 'fatima', email: 'fatima@culture.com', role: 'user', avatar: null, profileCompleted: true, bannedAt: null, banReason: null, lockedUntil: null, createdAt: hoursAgo(100) },
];

const MOCK_LOGS: AuditLog[] = [
  { id: 'l1', userId: 'admin1', userName: 'Jumana', action: 'report.ban', metadata: { reportId: 'r4', reason: 'NSFW content' }, ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: hoursAgo(1) },
  { id: 'l2', userId: 'u1', userName: 'Amal', action: 'user.login', metadata: { method: 'otp' }, ipAddress: '10.0.0.1', userAgent: 'Chrome/120', createdAt: hoursAgo(2) },
  { id: 'l3', userId: 'u2', userName: 'Keisuke', action: 'post.created', metadata: { postId: 'p101', type: 'Images' }, ipAddress: '10.0.0.2', userAgent: 'Safari/17', createdAt: hoursAgo(3) },
  { id: 'l4', userId: 'admin1', userName: 'Jumana', action: 'user.unban', metadata: { userId: 'u9', reason: 'Rétablissement' }, ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: hoursAgo(5) },
  { id: 'l5', userId: 'u4', userName: 'Kaelen', action: 'tribe.joined', metadata: { tribeId: 't1', tribeName: 'Norse Runes' }, ipAddress: '10.0.0.4', userAgent: 'Firefox/121', createdAt: hoursAgo(8) },
  { id: 'l6', userId: 'system', userName: 'System', action: 'stories.cleanup', metadata: { deleted: 23 }, ipAddress: null, userAgent: null, createdAt: hoursAgo(12) },
  { id: 'l7', userId: 'u3', userName: 'Jumana', action: 'report.dismiss', metadata: { reportId: 'r5', reason: 'False positive' }, ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: hoursAgo(24) },
];

const MOCK_ANALYTICS: AnalyticsData = {
  activity: [
    { label: 'Lun', utilisateurs: 2400, posts: 980, messages: 4200 },
    { label: 'Mar', utilisateurs: 1398, posts: 1200, messages: 3800 },
    { label: 'Mer', utilisateurs: 3800, posts: 1500, messages: 5100 },
    { label: 'Jeu', utilisateurs: 3908, posts: 1100, messages: 4800 },
    { label: 'Ven', utilisateurs: 4800, posts: 1800, messages: 6200 },
    { label: 'Sam', utilisateurs: 3800, posts: 1400, messages: 5500 },
    { label: 'Dim', utilisateurs: 4300, posts: 1600, messages: 5900 },
  ],
  growth: [
    { month: 'Jan', utilisateurs: 1200, tribus: 45 }, { month: 'Fév', utilisateurs: 1800, tribus: 62 },
    { month: 'Mar', utilisateurs: 2400, tribus: 89 }, { month: 'Avr', utilisateurs: 3100, tribus: 120 },
    { month: 'Mai', utilisateurs: 4500, tribus: 178 }, { month: 'Jun', utilisateurs: 5800, tribus: 210 },
    { month: 'Jul', utilisateurs: 7200, tribus: 256 }, { month: 'Aoû', utilisateurs: 8900, tribus: 298 },
    { month: 'Sep', utilisateurs: 10200, tribus: 315 }, { month: 'Oct', utilisateurs: 11500, tribus: 330 },
    { month: 'Nov', utilisateurs: 12100, tribus: 338 }, { month: 'Déc', utilisateurs: 12847, tribus: 342 },
  ],
  reportDistribution: [
    { name: 'Spam', value: 34, color: '#f59e0b' }, { name: 'Harcèlement', value: 18, color: '#ef4444' },
    { name: 'Contenu NSFW', value: 12, color: '#8b5cf6' }, { name: 'Discours haineux', value: 8, color: '#ec4899' },
    { name: 'Violence', value: 5, color: '#f97316' }, { name: 'Autre', value: 15, color: '#6b7280' },
  ],
  scoreDistribution: [
    { range: '0-20', count: 120 }, { range: '20-40', count: 340 }, { range: '40-60', count: 890 },
    { range: '60-80', count: 1560 }, { range: '80-100', count: 2156 },
  ],
  engagement: [
    { hour: '00h', likes: 120, comments: 45, shares: 20 }, { hour: '04h', likes: 45, comments: 12, shares: 5 },
    { hour: '08h', likes: 280, comments: 95, shares: 42 }, { hour: '12h', likes: 520, comments: 180, shares: 78 },
    { hour: '16h', likes: 680, comments: 240, shares: 95 }, { hour: '20h', likes: 890, comments: 320, shares: 120 },
    { hour: '23h', likes: 450, comments: 150, shares: 60 },
  ],
};

const MOCK_HEALTH: SystemHealth = {
  status: 'healthy', uptime: 864000, dbLatency: 4.2, redisLatency: 0.8,
  memoryUsage: 62, cpuUsage: 23, diskUsage: 34, activeConnections: 142, queueDepth: 3,
};

const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: 'a1', type: 'user_register', userId: 'u8', userName: 'Fatima Bello', details: 'Nouveau compte créé via OTP', createdAt: hoursAgo(0.5) },
  { id: 'a2', type: 'post_created', userId: 'u1', userName: 'Amal Kodjo', details: 'Tradition "Fon Drums" publiée', createdAt: hoursAgo(1) },
  { id: 'a3', type: 'match', userId: 'u2', userName: 'Keisuke', details: 'Match mutuel avec Jumana (score: 94%)', createdAt: hoursAgo(2) },
  { id: 'a4', type: 'tribe_joined', userId: 'u4', userName: 'Kaelen', details: 'A rejoint t/NorseRunes', createdAt: hoursAgo(3) },
  { id: 'a5', type: 'report', userId: 'u3', userName: 'Jumana', details: 'Signalement post p45 (nsfw)', createdAt: hoursAgo(4) },
  { id: 'a6', type: 'ban', userId: 'admin1', userName: 'Admin', details: 'Utilisateur u5 banni (harassment)', createdAt: hoursAgo(5) },
  { id: 'a7', type: 'login', userId: 'u6', userName: 'Carlos', details: 'Connexion via Google OAuth', createdAt: hoursAgo(6) },
];

// ── Service ────────────────────────────────────────────────

export const adminService = {
  // ── Stats ──
  async getStats(): Promise<AdminStats> {
    if (USE_MOCK) return MOCK_STATS;
    return api.get<AdminStats>('/api/admin/stats');
  },

  // ── Reports ──
  async getReports(status?: string): Promise<AdminReport[]> {
    if (USE_MOCK) return status ? MOCK_REPORTS.filter((r) => r.status === status) : MOCK_REPORTS;
    const params = status ? `?status=${status}` : '';
    const data = await api.get<{ reports: AdminReport[]; nextCursor: string | null }>(`/api/admin/reports${params}`);
    return data.reports ?? [];
  },

  async takeReportAction(reportId: string, action: ReportAction, reason?: string): Promise<void> {
    if (USE_MOCK) return;
    await api.post(`/api/admin/reports/${reportId}/action`, { action, reason });
  },

  // ── Users ──
  async getUsers(search?: string, status?: string): Promise<AdminUser[]> {
    if (USE_MOCK) {
      let users = MOCK_USERS;
      if (search) { const q = search.toLowerCase(); users = users.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)); }
      if (status === 'banned') users = users.filter((u) => u.bannedAt);
      if (status === 'suspended') users = users.filter((u) => u.lockedUntil && new Date(u.lockedUntil) > new Date());
      if (status === 'active') users = users.filter((u) => !u.bannedAt && !(u.lockedUntil && new Date(u.lockedUntil) > new Date()));
      return users;
    }
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const qs = params.toString();
    const data = await api.get<{ users: AdminUser[]; nextCursor: string | null }>(`/api/admin/users${qs ? `?${qs}` : ''}`);
    return data.users ?? [];
  },

  async banUser(userId: string, reason: string): Promise<void> {
    if (USE_MOCK) return;
    await api.post(`/api/admin/users/${userId}/ban`, { reason });
  },

  async unbanUser(userId: string, reason?: string): Promise<void> {
    if (USE_MOCK) return;
    await api.post(`/api/admin/users/${userId}/unban`, { reason });
  },

  // ── Audit Logs ──
  async getLogs(): Promise<AuditLog[]> {
    if (USE_MOCK) return MOCK_LOGS;
    return api.get<AuditLog[]>('/api/admin/logs');
  },

  // ── System Health ──
  async getHealth(): Promise<SystemHealth> {
    if (USE_MOCK) return MOCK_HEALTH;
    return api.get<SystemHealth>('/api/health/ready');
  },

  // ── Analytics (charts) ──
  async getAnalytics(period: string = '7d'): Promise<AnalyticsData> {
    if (USE_MOCK) return MOCK_ANALYTICS;
    return api.get<AnalyticsData>(`/api/admin/analytics?period=${period}`);
  },

  // ── Recent Activity ──
  async getActivity(): Promise<ActivityEvent[]> {
    if (USE_MOCK) return MOCK_ACTIVITY;
    return api.get<ActivityEvent[]>('/api/admin/activity');
  },
};
