import { describe, expect, it } from 'vitest';
import { storyMediaType } from '../../../../myculturematch-web/src/lib/storyMedia';

describe('storyMediaType', () => {
  it('vidéo pour les types video/*', () => {
    expect(storyMediaType('video/mp4')).toBe('video');
    expect(storyMediaType('VIDEO/WEBM')).toBe('video');
  });
  it('image pour le reste, y compris type vide ou inconnu', () => {
    expect(storyMediaType('image/png')).toBe('image');
    expect(storyMediaType('')).toBe('image');
    expect(storyMediaType(undefined)).toBe('image');
    expect(storyMediaType('application/octet-stream')).toBe('image');
  });
});
