import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { requireAuth } from '../auth/require-auth';
import { uploadRequestSchema, uploadCompleteSchema } from './uploads.schemas';
import { requestUpload, completeUpload } from './uploads.service';
import { getMediaProcessResult } from '../media/media.queue';

/** Routes /api/uploads (auth requise). */
export const uploadsModule = new Hono();

uploadsModule.use('*', requireAuth);

// POST /api/uploads/request — URL présignée PUT vers MinIO
uploadsModule.post('/request', zValidator('json', uploadRequestSchema), async (c) => {
  const { userId } = c.get('auth');
  const input = c.req.valid('json');
  const result = await requestUpload(userId, input);
  return c.json(result, 201);
});

// POST /api/uploads/complete — enfile le traitement media.process
uploadsModule.post('/complete', zValidator('json', uploadCompleteSchema), async (c) => {
  const { userId } = c.get('auth');
  const { uploadId } = c.req.valid('json');
  const result = await completeUpload(userId, uploadId);
  return c.json(result, 202);
});

// GET /api/uploads/:uploadId/status — état du traitement (owner uniquement)
uploadsModule.get('/:uploadId/status', async (c) => {
  const { userId } = c.get('auth');
  const uploadId = c.req.param('uploadId');
  const result = await getMediaProcessResult(uploadId);
  if (!result) return c.json({ status: 'pending' }, 200);
  if (result.userId !== userId) {
    return c.json({ error: { code: 'FORBIDDEN', message: 'Cet upload ne vous appartient pas' } }, 403);
  }
  return c.json({ status: 'done', uploadId: result.uploadId, objectKey: result.objectKey, contentType: result.contentType, thumbKey: result.thumbKey, width: result.width, height: result.height }, 200);
});
