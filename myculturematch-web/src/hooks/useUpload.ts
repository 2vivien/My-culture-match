import { useState } from 'react';
import { uploadService, type UploadPurpose, type UploadCompleteResult } from '@/src/services/uploadService';

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File, purpose: UploadPurpose): Promise<UploadCompleteResult | null> => {
    setIsUploading(true);
    setError(null);
    try {
      return await uploadService.uploadFile(file, purpose);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, error };
}
