import { z } from 'zod';

/** 26 topics prédéfinis pour les tribus. */
export const TRIBE_TOPICS = [
  'musique', 'danse', 'cuisine', 'mode', 'art', 'spiritualite', 'religion', 'langues',
  'histoire', 'cinema', 'litterature', 'sport', 'famille', 'mariage', 'education', 'sante',
  'travail', 'entreprise', 'technologie', 'posts', 'traditions', 'fetes', 'voyage', 'diaspora',
  'politique', 'environnement', 'jeunesse',
] as const;
export type TribeTopic = (typeof TRIBE_TOPICS)[number];

const ruleSchema = z.object({
  title: z.string().trim().min(2, 'Titre de règle : 2 caractères min').max(100),
  description: z.string().trim().min(2).max(300),
});

/** POST /api/tribes — création. */
export const createTribeSchema = z
  .object({
    name: z.string().trim().min(3, 'Nom : 3 caractères minimum').max(50, 'Nom : 50 caractères maximum'),
    tag: z.string().trim().toLowerCase().min(3, 'Tag : 3 caractères minimum').max(30, 'Tag : 30 caractères maximum').regex(/^[a-z0-9-]+$/, 'Tag : minuscules, chiffres, tirets'),
    description: z.string().trim().max(500).optional(),
    topic: z.enum(TRIBE_TOPICS),
    rules: z.array(ruleSchema).min(2, 'Au moins 2 règles requises').max(10).optional(),
    avatar: z.string().url().optional(),
    banner: z.string().url().optional(),
  })
  .strict();

export type CreateTribeInput = z.infer<typeof createTribeSchema>;

/** PATCH /api/tribes/:id. */
export const patchTribeSchema = z
  .object({
    name: z.string().trim().min(3).max(50).optional(),
    description: z.string().trim().max(500).optional(),
    topic: z.enum(TRIBE_TOPICS).optional(),
    avatar: z.string().url().optional(),
    banner: z.string().url().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Au moins un champ requis' });

export type PatchTribeInput = z.infer<typeof patchTribeSchema>;

/** GET /api/tribes — pagination + search. */
export const listTribesQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  cursor: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** POST /api/tribu/posts/:id/upvote. */
export const voteSchema = z
  .object({
    value: z.union([z.literal(1), z.literal(-1)]),
  })
  .strict();

/** POST /api/tribes/:id/moderators — promotion d'un membre. */
export const promoteModeratorSchema = z
  .object({
    userId: z.string().trim().min(1, 'userId requis'),
  })
  .strict();

/** POST /api/tribes/:id/report — signalement d'une tribu ou d'un post. */
export const reportSchema = z
  .object({
    reason: z.string().trim().min(3, 'Raison : 3 caractères minimum').max(300, 'Raison : 300 caractères maximum'),
  })
  .strict();

/** POST /api/tribes/:id/rules — ajout d'une règle. */
export const createRuleSchema = z
  .object({
    title: z.string().trim().min(2, 'Titre de règle : 2 caractères min').max(100),
    description: z.string().trim().min(2).max(300).optional(),
  })
  .strict();

/** PATCH /api/tribes/:id/rules/:ruleId — modification. */
export const patchRuleSchema = z
  .object({
    title: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().min(2).max(300).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Au moins un champ requis' });

export type PromoteModeratorInput = z.infer<typeof promoteModeratorSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type PatchRuleInput = z.infer<typeof patchRuleSchema>;
