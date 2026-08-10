import { Hono } from 'hono';
import { requireAuth } from '../auth/require-auth';
import { requestIdParamsSchema, requestParamsSchema } from './connections.schemas';
import {
  acceptRequest,
  blockRequester,
  declineRequest,
  getCompanions,
  getInterested,
  getRequests,
  getSuggestions,
  removeCompanion,
  sendRequest,
} from './connections.service';

const connectionsRoutes = new Hono();

connectionsRoutes.use('*', requireAuth);

/** GET /api/connections/suggestions — profils recommandés. */
connectionsRoutes.get('/connections/suggestions', async (c) => {
  const { userId } = c.get('auth');
  const result = await getSuggestions(userId);
  return c.json({ success: true, ...result });
});

/** GET /api/connections/interested — intéressés par moi. */
connectionsRoutes.get('/connections/interested', async (c) => {
  const { userId } = c.get('auth');
  const connections = await getInterested(userId);
  return c.json({ success: true, connections });
});

/** GET /api/connections/requests — demandes reçues. */
connectionsRoutes.get('/connections/requests', async (c) => {
  const { userId } = c.get('auth');
  const connections = await getRequests(userId);
  return c.json({ success: true, connections });
});

/** GET /api/connections/companions — connexions établies. */
connectionsRoutes.get('/connections/companions', async (c) => {
  const { userId } = c.get('auth');
  const connections = await getCompanions(userId);
  return c.json({ success: true, connections });
});

/** POST /api/connections/:userId/request — envoyer une demande. */
connectionsRoutes.post('/connections/:userId/request', async (c) => {
  const { userId } = c.get('auth');
  const { userId: targetId } = requestParamsSchema.parse(c.req.param());
  const result = await sendRequest(userId, targetId);
  return c.json(result, 200);
});

/** POST /api/requests/:id/accept — accepter. */
connectionsRoutes.post('/requests/:id/accept', async (c) => {
  const { userId } = c.get('auth');
  const { id } = requestIdParamsSchema.parse(c.req.param());
  const result = await acceptRequest(userId, id);
  return c.json(result, 200);
});

/** POST /api/requests/:id/decline — refuser. */
connectionsRoutes.post('/requests/:id/decline', async (c) => {
  const { userId } = c.get('auth');
  const { id } = requestIdParamsSchema.parse(c.req.param());
  const result = await declineRequest(userId, id);
  return c.json(result, 200);
});

/** POST /api/requests/:id/block — bloquer. */
connectionsRoutes.post('/requests/:id/block', async (c) => {
  const { userId } = c.get('auth');
  const { id } = requestIdParamsSchema.parse(c.req.param());
  const result = await blockRequester(userId, id);
  return c.json(result, 200);
});

/** DELETE /api/connections/:userId — supprimer un compagnon. */
connectionsRoutes.delete('/connections/:userId', async (c) => {
  const { userId } = c.get('auth');
  const { userId: targetId } = requestParamsSchema.parse(c.req.param());
  const result = await removeCompanion(userId, targetId);
  return c.json(result, 200);
});

export { connectionsRoutes };
