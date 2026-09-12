import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { swipeSchema } from './love.schemas';
import { withIdempotency, idempotencyKeyFrom } from '../../shared/utils/idempotency';
import { getLoveCandidates, getLoveCandidate, getActiveLoveMatches, swipe } from './love.service';

const loveRoutes = new Hono();

loveRoutes.use('*', requireAuth);

/** GET /api/love/matches — candidats compatibles. */
loveRoutes.get('/love/matches', async (c) => {
  const { userId } = c.get('auth');
  const { candidates } = await getLoveCandidates(userId);
  return c.json(candidates, 200);
});

/** GET /api/love/active — matchs actifs (likes réciproques acceptés). */
loveRoutes.get('/love/active', async (c) => {
  const { userId } = c.get('auth');
  const { candidates } = await getActiveLoveMatches(userId);
  return c.json(candidates, 200);
});

/** GET /api/love/matches/:id — détail candidat. */
loveRoutes.get('/love/matches/:id', async (c) => {
  const { userId } = c.get('auth');
  const { candidate } = await getLoveCandidate(userId, c.req.param('id'));
  return c.json(candidate, 200);
});

/** POST /api/love/swipe — like / pass (idempotent). */
loveRoutes.post('/love/swipe', zValidator('json', swipeSchema), async (c) => {
  const { userId: candidateId, action } = c.req.valid('json');
  const { userId } = c.get('auth');
  const result = await withIdempotency(`love:swipe:${userId}:${candidateId}`, idempotencyKeyFrom(c), () =>
    swipe(userId, candidateId, action),
  );
  return c.json(result, 200);
});

export { loveRoutes };
