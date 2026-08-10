import { z } from 'zod';

/** POST /api/love/swipe — like / pass. */
export const swipeSchema = z
  .object({
    userId: z.string().trim().min(1, 'userId requis'),
    action: z.enum(['like', 'pass']),
  })
  .strict();

export type SwipeInput = z.infer<typeof swipeSchema>;
