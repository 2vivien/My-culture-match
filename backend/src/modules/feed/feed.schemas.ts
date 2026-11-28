import { z } from 'zod';

/** GET /api/feed */
export const listFeedQuerySchema = z
  .object({
    filter: z.enum(['following', 'for-you', 'popular', 'new', 'tribes']).default('following'),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z
      .string()
      .regex(/^\d+$/, 'cursor invalide')
      .optional(),
  })
  .strict();
