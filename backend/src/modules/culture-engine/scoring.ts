/**
 * CULTURE ENGINE V1 — scoring pur et déterministe (MP15).
 * Chaque fonction est pure : pas d'accès DB/Redis, uniquement ses entrées.
 * Conforme à ALGO-culture-engine.md (§5 Feed, §6 Love, §7 Amitié).
 */

export interface PostFeatures {
  id: string;
  authorId: string;
  type: string;
  title: string | null;
  body: string | null;
  tags: string[];
  status: string;
  likes: number;
  comments: number;
  views: number;
  createdAt: Date | string;
  tribeId: string | null;
}

export interface UserFeatures {
  id: string;
  values: string[] | null;
  languages: string[] | null;
  ethnicity: string | null;
  country: string | null;
  region: string | null;
  interests?: string[];
}

export interface FeedContext {
  seenPostIds: string[];
  userCulture: string[];
  userVector?: Record<string, number>;
  postVectors?: Record<string, Record<string, number>>;
  sharedTribes?: number;
  followingAuthor?: boolean;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** P-ENG : probabilité d'engagement normalisée (TikTok). */
export function engagementPred(features: PostFeatures): number {
  const eng = features.likes + features.comments * 2 + features.views * 0.01;
  return clamp01(1 - Math.exp(-eng / 25));
}

/** P-SOC : affinité sociale (graphe : tribus communes, follow, connexions). */
export function socialAffinity(ctx: { sharedTribes: number; followingAuthor: boolean }): number {
  const tribes = clamp01(ctx.sharedTribes / 2);
  const follow = ctx.followingAuthor ? 0.6 : 0;
  return clamp01(0.4 * tribes + follow);
}

/** P-INT : overlap intérêts (tags du post vs profil). */
export function interestMatch(tags: string[], interests: string[]): number {
  if (tags.length === 0 || interests.length === 0) return 0.2;
  const set = new Set(interests.map((i) => i.toLowerCase()));
  const hits = tags.filter((t) => set.has(t.toLowerCase())).length;
  return clamp01(hits / Math.min(tags.length, 3));
}

/** P-CUL : résonance culturelle (cosinus des vecteurs, fallback tags/valeurs). */
export function cultureResonance(a: Record<string, number> | undefined, b: Record<string, number> | undefined): number {
  if (!a || !b || Object.keys(a).length === 0 || Object.keys(b).length === 0) return 0.4;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const k of Object.keys(a)) {
    const va = a[k] ?? 0;
    dot += va * (b[k] ?? 0);
    normA += va * va;
  }
  for (const k of Object.keys(b)) normB += (b[k] ?? 0) ** 2;
  if (normA === 0 || normB === 0) return 0.4;
  return clamp01((dot / Math.sqrt(normA * normB) + 1) / 2);
}

/** P-FR : fraîcheur — décroissance temporelle (courbe). */
export function freshness(createdAt: Date | string, alpha = 0.6): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  return clamp01(1 / (1 + alpha * Math.max(0, ageHours)));
}

/** P-DIV : bonus anti-bulle (L01) — contenus hors du profil habituel. */
export function diversityBoost(tags: string[], userCulture: string[]): number {
  if (tags.length === 0) return 0.5;
  const culture = new Set(userCulture.map((c) => c.toLowerCase()));
  const novel = tags.filter((t) => !culture.has(t.toLowerCase())).length / tags.length;
  return clamp01(0.3 + 0.7 * novel);
}

/** P-QUAL : qualité / authenticité (L02, L06). */
export function qualityEthics(features: PostFeatures): number {
  const text = `${features.title ?? ''} ${features.body ?? ''}`.trim();
  const length = text.length;
  if (length === 0) return 0.4;
  return clamp01(0.5 + Math.min(0.5, length / 2000));
}

/** P-ADD : pénalité anti-piège (L07) — 0 si contenu sain. */
export function addictionPenalty(features: PostFeatures): number {
  const bait = /\b(clique|crève|incroyable|secret|tu ne devineras)\b/i.test(`${features.title ?? ''} ${features.body ?? ''}`);
  const outrage = /\b(j'explose|m'enerve|détruit)\b/i.test(`${features.title ?? ''} ${features.body ?? ''}`);
  return (bait ? 0.3 : 0) + (outrage ? 0.3 : 0);
}

/** P-SAFE : filtre de sécurité (L03-L04) — score 0 si violation forte. */
export function safetyFilter(features: PostFeatures): { safe: boolean; score: number } {
  if (features.status === 'flagged') return { safe: false, score: 0 };
  return { safe: true, score: 1 };
}

/** SCORE FEED — fusion pondérée des 8 composants (§5.1). */
export function scoreFeed(post: PostFeatures, user: UserFeatures, ctx: FeedContext): number {
  const safe = safetyFilter(post);
  if (!safe.safe) return 0; // L03-L04 : zéro tolérance

  const eng = engagementPred(post);
  const soc = socialAffinity({ sharedTribes: ctx.sharedTribes ?? 0, followingAuthor: ctx.followingAuthor ?? false });
  const int = interestMatch(post.tags, [...(user.values ?? []), ...(user.interests ?? [])]);
  const cul = cultureResonance(ctx.postVectors?.[post.id], ctx.userVector);
  const fr = freshness(post.createdAt);
  const div = diversityBoost(post.tags, ctx.userCulture);
  const qual = qualityEthics(post);
  const add = addictionPenalty(post);

  const score =
    0.25 * eng + 0.2 * soc + 0.15 * int + 0.15 * cul + 0.1 * fr + 0.05 * div + 0.05 * qual - 0.05 * add;

  return clamp01(score);
}

// ── LOVE (MP15 §6) ─────────────────────────────────────────

/** P-VAL : alignement des valeurs (min/max Schwartz). */
export function valueAlignment(aValues: string[], bValues: string[]): number {
  if (aValues.length === 0 || bValues.length === 0) return 0.4;
  const a = new Set(aValues);
  const shared = bValues.filter((v) => a.has(v)).length;
  const total = new Set([...aValues, ...bValues]).size;
  return clamp01(shared / total);
}

/** P-PSY : complémentarité psychologique (Big Five approximée par valeurs). */
export function psychologyCompat(a: UserFeatures, b: UserFeatures): number {
  const align = valueAlignment(a.values ?? [], b.values ?? []);
  const complement = 0.5 + 0.5 * align;
  return clamp01(complement);
}

/** P-EMO : match émotionnel (chevauchement des valeurs émotionnelles). */
export function emotionalMatch(a: UserFeatures, b: UserFeatures): number {
  const emotional = ['joie', 'serenite', 'emerveillement', 'empathie', 'gratitude', 'courage'];
  const shared = emotional.filter((v) => (a.values ?? []).includes(v) && (b.values ?? []).includes(v));
  return clamp01(0.3 + shared.length * 0.12);
}

/**
 * P-CUL-ROOTS : racines culturelles partagées (pays, à défaut langues).
 * L'ethnie n'entre volontairement PAS dans ce score : donnée sensible, et un score affiché qui en dépend
 * permettrait de la déduire (même règle que modules/users/match-score.ts).
 */
export function culturalRoots(a: UserFeatures, b: UserFeatures): number {
  if (a.country && b.country && a.country === b.country) return 1;
  if ((a.languages?.length ?? 0) > 0 && (b.languages?.length ?? 0) > 0) {
    const overlap = (a.languages ?? []).filter((l) => (b.languages ?? []).includes(l)).length;
    return clamp01(overlap / Math.max((a.languages ?? []).length, (b.languages ?? []).length));
  }
  return 0;
}

/** P-PROX : proximité géographique. */
export function proximity(a: UserFeatures, b: UserFeatures): number {
  if (a.country && b.country && a.country === b.country) {
    return a.region && b.region && a.region === b.region ? 1 : 0.6;
  }
  return 0;
}

/** P-INT-LOVE : overlap d'intérêts. */
export function interestOverlap(a: UserFeatures, b: UserFeatures): number {
  return valueAlignment(a.interests ?? [], b.interests ?? []);
}

/** COMPAT LOVE — 0..100 (§6.1). chemistry fixe en V1. */
export function compatLove(a: UserFeatures, b: UserFeatures): number {
  const raw =
    0.3 * valueAlignment(a.values ?? [], b.values ?? []) +
    0.2 * psychologyCompat(a, b) +
    0.15 * emotionalMatch(a, b) +
    0.1 * culturalRoots(a, b) +
    0.1 * proximity(a, b) +
    0.1 * interestOverlap(a, b) +
    0.05 * 0.5; // chemistry V1 : constant
  return Math.round(clamp01(raw) * 100);
}

// ── AMITIÉ (MP15 §7) ───────────────────────────────────────

export interface SynergyFeatures {
  reciprocity: number; // 0..1
  density: number; // 0..1 (fréquence d'interactions)
  sharedTribes: number;
  valuesA: string[];
  valuesB: string[];
  toxicity: number; // 0..1 (signalements)
}

/** SYNERGY — 0..100 (§7.2). */
export function synergy(f: SynergyFeatures): number {
  const tribes = clamp01(f.sharedTribes / 2);
  const raw =
    f.reciprocity + f.density + tribes + valueAlignment(f.valuesA, f.valuesB) + 0.5 - f.toxicity;
  return Math.round(clamp01(raw / 5) * 100);
}
