import { Hono } from 'hono';
import { requireAuth } from '../auth/require-auth';
import { blockUser, unblockUser, listBlockedUsers, muteUser, unmuteUser, listMutedUsers, report, createAppeal, getMyModerationHistory } from './safety.service';

const safetyRoutes = new Hono();
safetyRoutes.use('*', requireAuth);

safetyRoutes.get('/safety/blocked', async (c) => { const { userId } = c.get('auth'); return c.json(await listBlockedUsers(userId)); });
safetyRoutes.post('/safety/users/:userId/block', async (c) => { const { userId } = c.get('auth'); return c.json(await blockUser(userId, c.req.param('userId')), 201); });
safetyRoutes.delete('/safety/users/:userId/block', async (c) => { const { userId } = c.get('auth'); return c.json(await unblockUser(userId, c.req.param('userId')), 200); });

safetyRoutes.get('/safety/muted', async (c) => { const { userId } = c.get('auth'); return c.json(await listMutedUsers(userId)); });
safetyRoutes.post('/safety/users/:userId/mute', async (c) => { const { userId } = c.get('auth'); return c.json(await muteUser(userId, c.req.param('userId')), 201); });
safetyRoutes.delete('/safety/users/:userId/mute', async (c) => { const { userId } = c.get('auth'); return c.json(await unmuteUser(userId, c.req.param('userId')), 200); });

safetyRoutes.post('/safety/report', async (c) => { const { userId } = c.get('auth'); return c.json(await report(userId, await c.req.json()), 201); });
safetyRoutes.get('/safety/moderation-history', async (c) => { const { userId } = c.get('auth'); return c.json(await getMyModerationHistory(userId)); });
safetyRoutes.post('/safety/appeals', async (c) => { const { userId } = c.get('auth'); const body = await c.req.json() as { moderationActionId?: string; reason?: string }; return c.json(await createAppeal(userId, body.moderationActionId ?? '', body.reason ?? ''), 201); });

export { safetyRoutes };
