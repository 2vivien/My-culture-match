import { z } from 'zod';

/** POST /api/conversations — création manuelle (1:1). */
export const createConversationSchema = z
  .object({
    participantId: z.string().trim().min(1, 'participantId requis'),
  })
  .strict();

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

/** POST /api/conversations/:id/messages — envoi. */
export const sendMessageSchema = z
  .object({
    text: z.string().trim().min(1, 'Message vide').max(4_000, 'Message trop long (4000 max)'),
    type: z.enum(['text', 'image', 'voice', 'file']).default('text'),
    mediaUrl: z.string().url().optional(),
    audioDur: z.number().int().positive().max(3_600).optional(),
    file: z
      .object({
        name: z.string().trim().min(1),
        size: z.number().int().nonnegative(),
      })
      .optional(),
  })
  .strict()
  .refine((v) => v.type === 'text' || v.mediaUrl || v.file, {
    message: 'Un message non-texte nécessite mediaUrl (ou file)',
  });

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/** GET /api/conversations/:id/messages — pagination cursor. */
export const listMessagesQuerySchema = z.object({
  cursor: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** GET /api/messages — alias liste conversations. */
export const listConversationsQuerySchema = z.object({
  cursor: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
