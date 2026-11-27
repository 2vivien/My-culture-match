import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { createEventSchema, listEventsQuerySchema, rsvpSchema } from './events.schemas';
import { cancelEvent, createEvent, getEvent, listEvents, setRsvp } from './events.service';

export const eventsRoutes = new Hono();
eventsRoutes.use('*', requireAuth);

eventsRoutes.get('/', zValidator('query', listEventsQuerySchema), async (c) => {
  const { userId } = c.get('auth');
  return c.json({ success: true, ...(await listEvents(userId, c.req.valid('query'))) });
});

eventsRoutes.post('/', zValidator('json', createEventSchema), async (c) => {
  const { userId } = c.get('auth');
  return c.json(await createEvent(userId, c.req.valid('json')), 201);
});

eventsRoutes.get('/:id', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await getEvent(userId, c.req.param('id')), 200);
});

eventsRoutes.post('/:id/rsvp', zValidator('json', rsvpSchema), async (c) => {
  const { userId } = c.get('auth');
  return c.json(await setRsvp(userId, c.req.param('id'), c.req.valid('json').status), 200);
});

eventsRoutes.delete('/:id', async (c) => {
  const { userId } = c.get('auth');
  return c.json(await cancelEvent(userId, c.req.param('id')), 200);
});
