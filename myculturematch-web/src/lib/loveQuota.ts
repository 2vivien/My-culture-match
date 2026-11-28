/** Quota de recherches « Love » : le serveur renvoie `remaining: -1` pour « illimité ». */
export function isQuotaExhausted(quota: { remaining: number }): boolean {
  return quota.remaining === 0;
}
