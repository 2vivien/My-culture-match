import { createHash } from 'node:crypto';

export const EMBEDDING_DIM = 768;

/** Hash stable d'un token → index de dimension [0, dim). */
function dimensionFor(token: string, dim: number): number {
  const h = createHash('sha256').update(token).digest();
  const value = h.readUInt32BE(0);
  return value % dim;
}

/** Signe stable (+/-) du hash. */
function signFor(token: string): number {
  const h = createHash('sha256').update(`s:${token}`).digest();
  return (h[0]! & 0x80) === 0 ? 1 : -1;
}

/**
 * Embedding V1 par sac de mots haché (signed hash, normalisé L2).
 * Déterministe et réel — remplaçable par un modèle ML en MP15.
 */
export function hashEmbedding(tokens: string[], dim = EMBEDDING_DIM): Record<string, number> {
  const vector = new Map<number, number>();
  const counts = new Map<string, number>();
  for (const token of tokens) {
    if (!token) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  for (const [token, count] of counts) {
    const idx = dimensionFor(token, dim);
    vector.set(idx, (vector.get(idx) ?? 0) + signFor(token) * count);
  }
  // Normalisation L2
  let norm = 0;
  for (const v of vector.values()) norm += v * v;
  norm = Math.sqrt(norm);
  const out: Record<string, number> = {};
  for (const [idx, v] of vector) {
    out[String(idx)] = norm > 0 ? v / norm : 0;
  }
  return out;
}

/** Tokenise un texte en mots simples (minuscules, sans ponctuation). */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9àâäéèêëîïôöùûüçœ-]+/)
    .filter((w) => w.length > 2);
}

/** Vecteur de similarité cosinus entre deux embeddings. */
export function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const k of Object.keys(a)) {
    const av = a[k] ?? 0;
    normA += av * av;
    const bv = b[k] ?? 0;
    dot += av * bv;
  }
  for (const v of Object.values(b)) normB += v * v;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
