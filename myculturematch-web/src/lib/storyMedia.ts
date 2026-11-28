/** Type de média d'une story d'après le type MIME du fichier choisi (le serveur attend `image` ou `video`). */
export function storyMediaType(mime: string | null | undefined): 'image' | 'video' {
  return typeof mime === 'string' && mime.toLowerCase().startsWith('video/') ? 'video' : 'image';
}
