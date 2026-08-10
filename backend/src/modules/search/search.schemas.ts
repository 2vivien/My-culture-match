import { z } from 'zod';

/** GET /api/search?q=&type=&limit=&offset= */
export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Requête trop courte (min 2 caractères)').max(100),
  type: z.enum(['users', 'posts', 'tribes', 'all']).default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
