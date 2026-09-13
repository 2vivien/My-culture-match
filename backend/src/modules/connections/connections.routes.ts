import { Hono } from 'hono';
import { requireAuth } from '../auth/require-auth';
import { requestIdParamsSchema, requestParamsSchema } from './connections.schemas';
import { canSendFriendRequest } from '../consent/consent.service';
import { AppError } from '../../shared/utils/AppError';
import { acceptRequest, blockRequester, declineRequest, getCompanions, getInterested, getNearbyFriends, getRequests, getSuggestions, removeCompanion, sendRequest } from './connections.service';

const connectionsRoutes = new Hono();
connectionsRoutes.use('*', requireAuth);

connectionsRoutes.get('/connections/suggestions', async (c) => { const { userId } = c.get('auth'); return c.json({ success: true, ...(await getSuggestions(userId)) }); });
connectionsRoutes.get('/connections/interested', async (c) => { const { userId } = c.get('auth'); return c.json({ success: true, connections: await getInterested(userId) }); });
connectionsRoutes.get('/connections/requests', async (c) => { const { userId } = c.get('auth'); return c.json({ success: true, connections: await getRequests(userId) }); });
connectionsRoutes.get('/connections/companions', async (c) => { const { userId } = c.get('auth'); return c.json({ success: true, connections: await getCompanions(userId) }); });
connectionsRoutes.get('/connections/nearby', async (c) => { const { userId } = c.get('auth'); return c.json({ success: true, ...(await getNearbyFriends(userId)) }); });

connectionsRoutes.post('/connections/:userId/request', async (c) => {
  const { userId } = c.get('auth');
  const { userId: targetId } = requestParamsSchema.parse(c.req.param());
  if (!(await canSendFriendRequest(userId, targetId))) throw AppError.forbidden('Cette personne n’accepte pas les demandes Friendship dans ses préférences de consentement', 'FRIENDSHIP_CONSENT_REQUIRED');
  return c.json(await sendRequest(userId, targetId), 200);
});

connectionsRoutes.post('/requests/:id/accept', async (c) => { const { userId } = c.get('auth'); const { id } = requestIdParamsSchema.parse(c.req.param()); return c.json(await acceptRequest(userId, id), 200); });
connectionsRoutes.post('/requests/:id/decline', async (c) => { const { userId } = c.get('auth'); const { id } = requestIdParamsSchema.parse(c.req.param()); return c.json(await declineRequest(userId, id), 200); });
connectionsRoutes.post('/requests/:id/block', async (c) => { const { userId } = c.get('auth'); const { id } = requestIdParamsSchema.parse(c.req.param()); return c.json(await blockRequester(userId, id), 200); });
connectionsRoutes.delete('/connections/:userId', async (c) => { const { userId } = c.get('auth'); const { userId: targetId } = requestParamsSchema.parse(c.req.param()); return c.json(await removeCompanion(userId, targetId), 200); });

export { connectionsRoutes };
