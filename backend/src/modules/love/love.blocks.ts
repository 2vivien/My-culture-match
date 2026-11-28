/** Blocages Love (logique PURE) : un blocage vaut dans les DEUX sens et vide les caches de suggestions des deux personnes. */

export interface BlockRow { blockerId: string; blockedId: string }

/** Identifiants des personnes avec lesquelles `userId` a un blocage, que ce soit lui qui bloque ou lui qui est bloqué. */
export function counterpartsBlockedWith(userId: string, rows: readonly BlockRow[]): Set<string> {
  const out = new Set<string>();
  for (const r of rows) {
    if (r.blockerId === userId) out.add(r.blockedId);
    else if (r.blockedId === userId) out.add(r.blockerId);
  }
  return out;
}

export const loveCandidatesKey = (userId: string): string => `love:candidates:${userId}`;

/** Clés Redis à invalider quand A bloque B : les suggestions en cache des deux personnes (B apparaît chez A et inversement). */
export function loveCachesToInvalidate(a: string, b: string): string[] {
  return [loveCandidatesKey(a), loveCandidatesKey(b)];
}
