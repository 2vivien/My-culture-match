import { z } from 'zod';

export const POST_TYPES = ['Text', 'Images', 'Link', 'Repost'] as const;
export type PostType = (typeof POST_TYPES)[number];

const TAG_REGEX = /^[a-z0-9-]+$/;

const basePostFields = {
  title: z.string().trim().min(3, 'Titre : 3 caractères minimum').max(200, 'Titre : 200 caractères maximum').optional(),
  body: z.string().trim().max(5000, 'Contenu : 5000 caractères maximum').optional(),
  mediaUrls: z.array(z.string().url()).min(1, 'Au moins un média requis').max(10, '10 médias maximum').optional(),
  linkUrl: z.string().url('URL invalide').optional(),
  tribeId: z.string().trim().min(1).optional(),
  tags: z.array(z.string().regex(TAG_REGEX, 'Tag : lettres minuscules, chiffres ou tirets uniquement')).max(5, '5 tags maximum').optional(),
};

/** POST /api/posts — création d'une tradition (ou d'un repost). */
export const createPostSchema = z
  .object({
    type: z.enum(POST_TYPES),
    ...basePostFields,
    /** Requis si type=Repost : le post original à repartager. */
    originalPostId: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.type === 'Repost' && !val.originalPostId) {
      ctx.addIssue({ code: 'custom', path: ['originalPostId'], message: "originalPostId est requis pour un repost" });
    }
  });

export type CreatePostInput = z.infer<typeof createPostSchema>;

/** POST /api/posts/:id/comments */
export const createCommentSchema = z
  .object({
    text: z.string().trim().min(1, 'Commentaire vide').max(2000, 'Commentaire : 2000 caractères maximum'),
    parentId: z.string().trim().min(1).optional(),
  })
  .strict();

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/** GET /api/posts/:id/comments — pagination cursor. */
export const listCommentsQuerySchema = z.object({
  cursor: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  /** `new` (défaut, historique) : plus récents d'abord ; `best` / `top` / `old` : arbre trié, curseur = décalage. */
  sort: z.enum(['best', 'top', 'new', 'old']).default('new'),
});

/** POST /api/posts/:id/comments/:commentId/vote. */
export const commentVoteSchema = z.object({ value: z.union([z.literal(1), z.literal(-1)]) }).strict();
