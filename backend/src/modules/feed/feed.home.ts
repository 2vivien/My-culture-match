/** Classement « Hot » du fil d'accueil des tribus (pur, testable). */

/** Reddit : le signe et le log10 du score net, plus l'âge (45 000 s ≈ 12 h 30 par décade de score). */
export function hotRank(score: number, createdAt: Date | string): number {
  const seconds = new Date(createdAt).getTime() / 1000;
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  return sign * Math.log10(Math.max(Math.abs(score), 1)) + seconds / 45000;
}

/** Trie du plus « hot » au moins « hot ». À rang égal, le plus récent d'abord. Ne modifie pas l'entrée. */
export function sortHot<T extends { score: number; createdAt: Date | string }>(posts: T[]): T[] {
  return [...posts].sort(
    (a, b) =>
      hotRank(b.score, b.createdAt) - hotRank(a.score, a.createdAt) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/** Fenêtre de candidats du fil d'accueil. */
export const HOME_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
