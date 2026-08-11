const MEDIA_URL = (import.meta.env.VITE_MEDIA_URL as string | undefined) ?? 'http://localhost:9000/mcm-media';

/** Construit l'URL publique d'un objet MinIO à partir de son objectKey. */
export function mediaUrl(objectKey: string): string {
  return `${MEDIA_URL}/${objectKey.replace(/^\//, '')}`;
}
