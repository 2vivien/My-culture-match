import { z } from 'zod';
import { EVENT_VISIBILITIES, RSVP_STATUSES } from './events.policy';

/** POST /api/events. */
export const createEventSchema = z
  .object({
    title: z.string().trim().min(3, 'Titre : 3 caractères minimum').max(100, 'Titre : 100 caractères maximum'),
    description: z.string().trim().max(1000, 'Description : 1000 caractères maximum').optional(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }).optional(),
    visibility: z.enum(EVENT_VISIBILITIES),
    /** Obligatoire pour la visibilité « tribu », interdit sinon. */
    tribeId: z.string().trim().min(1).optional(),
    /** Lieu culturel (obligatoire et publié pour un événement public). */
    placeId: z.string().trim().min(1).optional(),
    /** Point libre : réservé aux événements « amis » et « tribu ». */
    point: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        label: z.string().trim().max(120).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type CreateEventInput = z.infer<typeof createEventSchema>;

/** GET /api/events?lat=&lon=&radiusKm=&days= */
export const listEventsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(1).max(50).default(25),
  /** Horizon : événements commençant dans les N prochains jours. */
  days: z.coerce.number().int().min(1).max(90).default(30),
});

/** POST /api/events/:id/rsvp — status null retire la réponse. */
export const rsvpSchema = z.object({ status: z.enum(RSVP_STATUSES).nullable() }).strict();
