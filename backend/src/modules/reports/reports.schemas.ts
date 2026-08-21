import { z } from 'zod';
import { REPORT_REASONS, REPORT_TARGET_TYPES } from '../admin/admin.schemas';

/** POST /api/reports — signalement d'un contenu par un utilisateur. */
export const createReportSchema = z
  .object({
    targetType: z.enum(REPORT_TARGET_TYPES),
    targetId: z.string().trim().min(1).max(120),
    reason: z.enum(REPORT_REASONS),
    description: z.string().trim().max(1000).optional(),
  })
  .strict();

export type CreateReportInput = z.infer<typeof createReportSchema>;
