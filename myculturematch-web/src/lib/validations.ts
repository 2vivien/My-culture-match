import { z } from 'zod';

export const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Veuillez renseigner votre adresse email.')
    .email('Adresse email invalide.'),
});

export type EmailFormValues = z.infer<typeof emailSchema>;
