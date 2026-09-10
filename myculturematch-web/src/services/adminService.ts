import { api } from './api';

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

// ── Service ────────────────────────────────────────────────

export const adminService = {
  async getStats(): Promise<AdminStats> {
    return api.get<AdminStats>('/api/admin/stats');
  },

  async getReports(status?: string): Promise<AdminReport[]> {
    const params = status ? `?status=${status}` : '';
    const data = await api.get<{ reports: AdminReport[]; nextCursor: string | null }>(`/api/admin/reports${params}`);
    return data.reports ?? [];
  },

  async takeReportAction(reportId: string, action: ReportAction, reason?: string): Promise<void> {
    await api.post(`/api/admin/reports/${reportId}/action`, { action, reason });
  },

  async getUsers(search?: string, status?: string): Promise<AdminUser[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const qs = params.toString();
    const data = await api.get<{ users: AdminUser[]; nextCursor: string | null }>(`/api/admin/users${qs ? `?${qs}` : ''}`);
    return data.users ?? [];
  },

  async banUser(userId: string, reason: string): Promise<void> {
    await api.post(`/api/admin/users/${userId}/ban`, { reason });
  },

  async unbanUser(userId: string, reason?: string): Promise<void> {
    await api.post(`/api/admin/users/${userId}/unban`, { reason });
  },

  async getLogs(): Promise<AuditLog[]> {
    const data = await api.get<{ logs: AuditLog[]; nextCursor: string | null }>('/api/admin/logs');
    return data.logs ?? [];
  },

  async getHealth(): Promise<SystemHealth> {
    return api.get<SystemHealth>('/api/admin/health');
  },

  async getAnalytics(period: string = '7d'): Promise<AnalyticsData> {
    return api.get<AnalyticsData>(`/api/admin/analytics?period=${period}`);
  },

  async getActivity(): Promise<ActivityEvent[]> {
    return api.get<ActivityEvent[]>('/api/admin/activity');
  },
};
