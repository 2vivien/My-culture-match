const MEDIA_URL = (import.meta.env.VITE_MEDIA_URL as string | undefined) ?? 'http://localhost:9000/mcm-media';

/** Construit l'URL publique d'un objet MinIO à partir de son objectKey. */
export function mediaUrl(objectKey: string): string {
  return `${MEDIA_URL}/${objectKey.replace(/^\//, '')}`;
}

/**
 * Avatar de repli : avatar généré DiceBear basé sur le nom (jamais d'initiales
 * type "vi"). Utilisé partout où l'utilisateur n'a pas encore de photo réelle.
 */
export function fallbackAvatar(seed?: string | null): string | undefined {
  const s = (seed ?? '').trim();
  if (!s) return undefined;
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(s)}`;
}
