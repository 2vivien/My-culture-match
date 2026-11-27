import { z } from 'zod';
import { PLACE_CATEGORIES, PLACE_STATUSES } from './places.policy';

/** POST /api/places — proposition d'un lieu (modération avant publication). */
export const proposePlaceSchema = z
  .object({
    name: z.string().trim().min(3, 'Nom : 3 caractères minimum').max(80, 'Nom : 80 caractères maximum'),
    category: z.enum(PLACE_CATEGORIES),
    description: z.string().trim().max(500, 'Description : 500 caractères maximum').optional(),
    country: z.string().trim().min(2).max(60).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .strict();
export type ProposePlaceInput = z.infer<typeof proposePlaceSchema>;

/** GET /api/places?lat=&lon=&radiusKm=&category= */
export const listPlacesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(1).max(50).default(25),
  category: z.enum(PLACE_CATEGORIES).optional(),
});

/** GET /api/admin/places */
export const adminListPlacesQuerySchema = z.object({
  status: z.enum(PLACE_STATUSES).default('pending'),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/** POST /api/admin/places/:id/approve | reject */
export const moderatePlaceSchema = z.object({ reason: z.string().trim().max(300).optional() }).strict();
