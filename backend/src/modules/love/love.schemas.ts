import { z } from 'zod';

/** POST /api/love/swipe — like / pass. */
export const swipeSchema = z
  .object({
    userId: z.string().trim().min(1, 'userId requis'),
    action: z.enum(['like', 'pass']),
  })
  .strict();

/** POST /api/love/search — natural-language matchmaking request. */
export const loveSearchSchema = z
  .object({ query: z.string().trim().min(3).max(500) })
  .strict();

export type SwipeInput = z.infer<typeof swipeSchema>;
export type LoveSearchInput = z.infer<typeof loveSearchSchema>;
