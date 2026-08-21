import { describe, it, expect } from 'vitest';
import { AppError } from '../../../src/shared/utils/AppError';
import { calculateAge, isAdult } from '../../../src/shared/utils/age';
import { extractHashtags, isValidPublicUrl } from '../../../src/shared/utils/content';
import { generateTotpSecret, generateTotpCode, verifyTotpCode, buildOtpauthUri } from '../../../src/shared/utils/totp';
import { generateUsernameSuggestions } from '../../../src/shared/utils/usernames';
import { generateId } from '../../../src/shared/utils/ids';

describe('AppError', () => {
  it('fabrique une erreur 404 avec code stable', () => {
    const err = AppError.notFound('introuvable');
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('introuvable');
    expect(err).toBeInstanceOf(Error);
  });

  it('fabrique les statuts communs', () => {
    expect(AppError.badRequest('x').status).toBe(400);
    expect(AppError.unauthorized().status).toBe(401);
    expect(AppError.forbidden().status).toBe(403);
    expect(AppError.conflict('x').status).toBe(409);
    expect(AppError.tooMany().status).toBe(429);
  });
});

describe('âge', () => {
  it('calcule l’âge en années révolues', () => {
    const now = new Date();
    const birth = new Date(now.getFullYear() - 25, now.getMonth(), now.getDate());
    expect(calculateAge(birth)).toBe(25);
  });

  it('isAdult : 18 ans minimum', () => {
    const now = new Date();
    expect(isAdult(new Date(now.getFullYear() - 18, now.getMonth(), now.getDate()))).toBe(true);
    expect(isAdult(new Date(now.getFullYear() - 17, now.getMonth(), now.getDate()))).toBe(false);
  });
});

describe('contenu', () => {
  it('extrait les hashtags sans doublon (max 5)', () => {
    expect(extractHashtags('#Musique #danse #musique #a #culture #histoire #art #film #sport')).toEqual([
      'musique', 'danse', 'culture', 'histoire', 'art',
    ]);
  });

  it('valide uniquement les URLs publiques', () => {
    expect(isValidPublicUrl('https://cdn.example.com/a.jpg')).toBe(true);
    expect(isValidPublicUrl('http://localhost:9000/a.jpg')).toBe(false);
    expect(isValidPublicUrl('file:///etc/passwd')).toBe(false);
    expect(isValidPublicUrl('pas une url')).toBe(false);
  });
});

describe('TOTP', () => {
  it('génère un secret Base32 valide', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(secret.length).toBeGreaterThanOrEqual(16);
  });

  it('vérifie un code généré (fenêtre ±1 step)', () => {
    const secret = generateTotpSecret();
    const code = generateTotpCode(secret);
    expect(code).toMatch(/^\d{6}$/);
    expect(verifyTotpCode(secret, code)).toBe(true);
  });

  it('rejette un code erroné ou malformé', () => {
    const secret = generateTotpSecret();
    const code = generateTotpCode(secret);
    const wrong = code === '000000' ? '111111' : '000000';
    expect(verifyTotpCode(secret, wrong)).toBe(false);
    expect(verifyTotpCode(secret, '12345')).toBe(false);
  });

  it('construit une URI otpauth:// standard', () => {
    const uri = buildOtpauthUri('SECRET', 'user@example.com');
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('issuer=MyCultureMatch');
    expect(uri).toContain('digits=6');
  });
});

describe('usernames', () => {
  it('génère 3 suggestions uniques au format {base}{n}', () => {
    const suggestions = generateUsernameSuggestions('Amadou');
    expect(suggestions).toHaveLength(3);
    expect(new Set(suggestions).size).toBe(3);
    for (const s of suggestions) {
      expect(s).toMatch(/^Amadou[._]?\d{4}$/);
    }
  });

  it('nettoye les caractères invalides', () => {
    const suggestions = generateUsernameSuggestions('a b!');
    expect(new Set(suggestions).size).toBe(3);
    expect(suggestions[0]).toMatch(/^ab\d{4}$/);
  });
});

describe('ids', () => {
  it('génère un UUID v7 (triable par temps, version 7 + variant RFC 4122)', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('génère des IDs uniques et croissants dans le temps', () => {
    const first = generateId();
    const second = generateId();
    expect(first).not.toBe(second);
    expect(first < second).toBe(true);
  });
});
