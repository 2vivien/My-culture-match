import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, type ReportAction, type AnalyticsData } from '@/src/services/adminService';

/** Stats globales admin. */
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminService.getStats,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 30,
  });
}

/** Liste des reports de modération. */
export function useAdminReports(status?: string) {
  return useQuery({
    queryKey: ['admin', 'reports', status],
    queryFn: () => adminService.getReports(status),
    staleTime: 1000 * 30,
  });
}

/** Action sur un report (warn/suspend/ban/dismiss). */
export function useReportAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, action, reason }: { reportId: string; action: ReportAction; reason?: string }) =>
      adminService.takeReportAction(reportId, action, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

/** Liste des utilisateurs admin. */
export function useAdminUsers(search?: string, status?: string) {
  return useQuery({
    queryKey: ['admin', 'users', search, status],
    queryFn: () => adminService.getUsers(search, status),
    staleTime: 1000 * 60 * 2,
  });
}

/** Ban un utilisateur. */
export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => adminService.banUser(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

/** Unban un utilisateur. */
export function useUnbanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) => adminService.unbanUser(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

/** Audit logs. */
export function useAdminLogs() {
  return useQuery({
    queryKey: ['admin', 'logs'],
    queryFn: adminService.getLogs,
    staleTime: 1000 * 60,
  });
}

/** Système health. */
export function useSystemHealth() {
  return useQuery({
    queryKey: ['admin', 'health'],
    queryFn: adminService.getHealth,
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 15,
  });
}

/** Activité récente. */
export function useAdminActivity() {
  return useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: adminService.getActivity,
    staleTime: 1000 * 30,
  });
}

/** Analytics charts ( vraies données backend ). */
export function useAdminAnalytics(period: string = '7d') {
  return useQuery<AnalyticsData>({
    queryKey: ['admin', 'analytics', period],
    queryFn: () => adminService.getAnalytics(period),
    staleTime: 1000 * 60,
  });
}
