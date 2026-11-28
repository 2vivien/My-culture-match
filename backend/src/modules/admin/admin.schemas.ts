import { z } from 'zod';

export const REPORT_ACTIONS = ['warn', 'suspend', 'ban', 'dismiss'] as const;
export const REPORT_STATUSES = ['open', 'reviewed', 'dismissed', 'actioned'] as const;
export const REPORT_TARGET_TYPES = ['user', 'post', 'comment', 'message', 'place'] as const;
export const REPORT_REASONS = ['harassment', 'spam', 'hate_speech', 'nsfw', 'violence', 'other'] as const;

export type ReportAction = (typeof REPORT_ACTIONS)[number];

/** GET /api/admin/reports */
export const listReportsQuerySchema = z
  .object({
    status: z.enum(REPORT_STATUSES).optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

/** POST /api/admin/reports/:id/action */
export const reportActionSchema = z
  .object({
    action: z.enum(REPORT_ACTIONS),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

/** GET /api/admin/users */
export const listAdminUsersQuerySchema = z
  .object({
    search: z.string().trim().max(80).optional(),
    status: z.enum(['active', 'suspended', 'banned']).optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

/** POST /api/admin/users/:id/ban */
export const banUserSchema = z
  .object({
    reason: z.string().trim().min(1, 'Une raison est requise').max(500),
    durationDays: z.coerce.number().int().positive().max(3650).optional(),
  })
  .strict();

/** POST /api/admin/users/:id/unban */
export const unbanUserSchema = z
  .object({
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

/** GET /api/admin/analytics */
export const analyticsQuerySchema = z
  .object({
    period: z.enum(['7d', '30d', '90d', '12m']).default('7d'),
  })
  .strict();
