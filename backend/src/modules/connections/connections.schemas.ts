import { z } from 'zod';

/** POST /api/connections/:userId/request — envoi de demande. */
export const requestParamsSchema = z.object({
  userId: z.string().trim().min(1),
});

/** POST /api/requests/:id/accept|decline|block — réponse à une demande. */
export const requestIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});
