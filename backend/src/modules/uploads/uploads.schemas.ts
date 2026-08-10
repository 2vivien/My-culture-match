import { z } from 'zod';

export const UPLOAD_PURPOSES = ['avatar', 'story', 'post', 'voice', 'file'] as const;
export const UPLOAD_TYPES = ['image', 'video', 'audio'] as const;

/** Whitelist MIME → extension + taille max octets. */
export const MIME_WHITELIST: Record<string, { ext: string; kind: (typeof UPLOAD_TYPES)[number]; maxBytes: number }> = {
  'image/jpeg': { ext: '.jpg', kind: 'image', maxBytes: 10 * 1024 * 1024 },
  'image/png': { ext: '.png', kind: 'image', maxBytes: 10 * 1024 * 1024 },
  'image/webp': { ext: '.webp', kind: 'image', maxBytes: 10 * 1024 * 1024 },
  'image/gif': { ext: '.gif', kind: 'image', maxBytes: 15 * 1024 * 1024 },
  'image/heic': { ext: '.heic', kind: 'image', maxBytes: 15 * 1024 * 1024 },
  'video/mp4': { ext: '.mp4', kind: 'video', maxBytes: 100 * 1024 * 1024 },
  'video/quicktime': { ext: '.mov', kind: 'video', maxBytes: 100 * 1024 * 1024 },
  'video/webm': { ext: '.webm', kind: 'video', maxBytes: 100 * 1024 * 1024 },
  'audio/mpeg': { ext: '.mp3', kind: 'audio', maxBytes: 25 * 1024 * 1024 },
  'audio/wav': { ext: '.wav', kind: 'audio', maxBytes: 50 * 1024 * 1024 },
  'audio/ogg': { ext: '.ogg', kind: 'audio', maxBytes: 25 * 1024 * 1024 },
} as const;

/** POST /api/uploads/request */
export const uploadRequestSchema = z
  .object({
    contentType: z.string().trim().min(3).max(100),
    size: z.number().int().positive().max(200 * 1024 * 1024, 'Fichier trop volumineux'),
    purpose: z.enum(UPLOAD_PURPOSES).default('file'),
  })
  .strict();

export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;

/** POST /api/uploads/complete */
export const uploadCompleteSchema = z
  .object({
    uploadId: z.string().trim().min(1),
  })
  .strict();

export type UploadCompleteInput = z.infer<typeof uploadCompleteSchema>;
