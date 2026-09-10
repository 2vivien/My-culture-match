import { api } from './api';

export type UploadPurpose = 'avatar' | 'story' | 'post' | 'voice' | 'file';

const MIME_WHITELIST: Record<string, { maxBytes: number }> = {
  'image/jpeg': { maxBytes: 10 * 1024 * 1024 },
  'image/png': { maxBytes: 10 * 1024 * 1024 },
  'image/webp': { maxBytes: 10 * 1024 * 1024 },
  'image/gif': { maxBytes: 15 * 1024 * 1024 },
  'image/heic': { maxBytes: 15 * 1024 * 1024 },
  'video/mp4': { maxBytes: 100 * 1024 * 1024 },
  'video/quicktime': { maxBytes: 100 * 1024 * 1024 },
  'video/webm': { maxBytes: 100 * 1024 * 1024 },
  'audio/mpeg': { maxBytes: 25 * 1024 * 1024 },
  'audio/wav': { maxBytes: 50 * 1024 * 1024 },
  'audio/ogg': { maxBytes: 25 * 1024 * 1024 },
} as const;

export interface UploadRequestResult {
  uploadId: string;
  objectKey: string;
  contentType: string;
  presignedUrl: string;
  expiresIn: number;
}

export interface UploadCompleteResult {
  objectKey: string;
  contentType: string;
  status: 'processing' | 'done';
  thumbKey?: string | null;
  width?: number;
  height?: number;
}

export interface UploadStatusResult {
  status: 'pending' | 'done';
  uploadId?: string;
  objectKey?: string;
  contentType?: string;
  thumbKey?: string | null;
  width?: number;
  height?: number;
}

function assertSupported(file: File): void {
  const mime = MIME_WHITELIST[file.type];
  if (!mime) {
    throw new Error(`Type de fichier non supporté : ${file.type || 'inconnu'}`);
  }
  if (file.size > mime.maxBytes) {
    const maxMb = Math.round(mime.maxBytes / 1024 / 1024);
    throw new Error(`Fichier trop volumineux (max ${maxMb} Mo)`);
  }
}

export const uploadService = {
  async requestUpload(
    contentType: string,
    size: number,
    purpose: UploadPurpose,
  ): Promise<UploadRequestResult> {
    return api.post<UploadRequestResult>('/api/uploads/request', { contentType, size, purpose });
  },

  async uploadToPresigned(presignedUrl: string, file: File): Promise<void> {
    const res = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!res.ok) {
      throw new Error(`Upload du fichier échoué (${res.status})`);
    }
  },

  async completeUpload(uploadId: string): Promise<UploadCompleteResult> {
    return api.post<UploadCompleteResult>('/api/uploads/complete', { uploadId });
  },

  async getStatus(uploadId: string): Promise<UploadStatusResult> {
    return api.get<UploadStatusResult>(`/api/uploads/${uploadId}/status`);
  },

  async uploadFile(file: File, purpose: UploadPurpose): Promise<UploadCompleteResult> {
    assertSupported(file);
    const request = await this.requestUpload(file.type, file.size, purpose);
    await this.uploadToPresigned(request.presignedUrl, file);
    return this.completeUpload(request.uploadId);
  },
};
