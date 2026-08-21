import { z } from 'zod';

const STORY_MEDIA_MAX = 100 * 1024 * 1024; // 100MB

/** POST /api/stories — création (le front envoie `img`, le spec `mediaUrl`). */
export const createStorySchema = z
  .object({
    img: z.string().url('URL image invalide').max(STORY_MEDIA_MAX).optional(),
    mediaUrl: z.string().url('URL média invalide').max(STORY_MEDIA_MAX).optional(),
    type: z.enum(['image', 'video']).default('image'),
    caption: z.string().max(500).optional(),
  })
  .refine((v) => Boolean(v.img || v.mediaUrl), { message: 'img ou mediaUrl est requis' });
