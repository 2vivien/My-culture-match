import { describe, expect, it } from 'vitest';
import { safeImageUrl } from '../../../../myculturematch-web/src/lib/safeUrl';

describe('safeImageUrl', () => {
  it('accepte les URL http et https', () => {
    expect(safeImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
    expect(safeImageUrl('http://localhost:9000/mcm-media/a.jpg')).toBe('http://localhost:9000/mcm-media/a.jpg');
  });

  it('refuse une injection par guillemet (attribut onerror)', () => {
    expect(safeImageUrl('https://x.io/a.png"onerror="alert(1)')).toBeNull();
    expect(safeImageUrl('https://x.io/a.png" onerror="alert(1)')).toBeNull();
    expect(safeImageUrl('https://x.io/a.png><script>alert(1)</script>')).toBeNull();
  });

  it('refuse les schémas dangereux', () => {
    expect(safeImageUrl('javascript:alert(1)')).toBeNull();
    expect(safeImageUrl('JaVaScRiPt:alert(1)')).toBeNull();
    expect(safeImageUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBeNull();
    expect(safeImageUrl('blob:https://x.io/abc')).toBeNull();
    expect(safeImageUrl('file:///etc/passwd')).toBeNull();
  });

  it('refuse espaces, retours à la ligne et caractères de contrôle', () => {
    expect(safeImageUrl('https://x.io/a b.png')).toBeNull();
    expect(safeImageUrl('https://x.io/a.png\nonerror=1')).toBeNull();
    expect(safeImageUrl('https://x.io/\u0000a.png')).toBeNull();
  });

  it('refuse les valeurs vides, relatives ou non textuelles', () => {
    expect(safeImageUrl('')).toBeNull();
    expect(safeImageUrl('   ')).toBeNull();
    expect(safeImageUrl('/uploads/a.png')).toBeNull();
    expect(safeImageUrl(null)).toBeNull();
    expect(safeImageUrl(undefined)).toBeNull();
    expect(safeImageUrl(42)).toBeNull();
  });

  it('refuse une URL démesurée', () => {
    expect(safeImageUrl(`https://x.io/${'a'.repeat(3000)}`)).toBeNull();
  });
});
