import { z } from 'zod';

const STORY_MEDIA_MAX = 100 * 1024 * 1024; // 100MB

/** POST /api/stories — création (le front envoie `img`, le spec `mediaUrl`). */
export const createStorySchema = z
  .object({
    img: z.string().url('URL image invalide').max(STORY_MEDIA_MAX).optional(),
    mediaUrl: z.string().url('URL média invalide').max(STORY_MEDIA_MAX).optional(),
    type: z.enum(['image', 'video']).default('image'),
    caption: z.string().max(500).optional(),
    /** Lieu CHOISI (recherche de lieu), pas le GPS du téléphone. Ramené à une grille côté serveur. */
    place: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        label: z.string().max(200).optional(),
      })
      .strict()
      .optional(),
  })
  .refine((v) => Boolean(v.img || v.mediaUrl), { message: 'img ou mediaUrl est requis' });

/** GET /api/location/stories?lat=&lon= — origine facultative (sinon la position partagée du lecteur). */
export const mapStoriesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
});
