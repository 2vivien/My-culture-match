/**
 * Auto-modération V1 (heuristique, hors-ligne).
 * Remplace l'appel à un fournisseur IA (Hive/OpenAI) tant qu'aucune clé
 * n'est configurée. La structure permet de brancher un provider plus tard.
 */

const TOXIC_PATTERNS: RegExp[] = [
  /\b(conard|conasse|connard|connasse)\b/i,
  /\b(salope|pute|putain|fdp|bordel)\b/i,
  /\b(encul[ée]|niquer|baise(r|z)?)\b/i,
  /\b(négro|nègre|sale noir)\b/i,
  /\b(youpin|bougnoule|sale arabe|sale juif)\b/i,
  /\b(ta gueule|ferme ta|dégage|va chier|cas[s]e? toi)\b/i,
  /\b(je vais te (tuer|buter|descendre)|tu vas (mourir|crever))\b/i,
  /\b(mort à |à mort les? |tuez les?)\b/i,
];

const SPAM_PATTERN = /(?:https?:\/\/[^\s]+\s*){3,}/i;

export interface ModerationResult {
  flag: boolean;
  reason: string | null;
}

/** Analyse un texte et retourne flag + raison (null si propre). */
export function moderateText(text: string): ModerationResult {
  const joined = text ?? '';
  for (const pattern of TOXIC_PATTERNS) {
    if (pattern.test(joined)) {
      return { flag: true, reason: 'TOXIC_LANGUAGE' };
    }
  }
  if (SPAM_PATTERN.test(joined)) {
    return { flag: true, reason: 'SPAM' };
  }
  return { flag: false, reason: null };
}

/** Analyse titre + body d'un post. */
export function moderatePost(title: string, body?: string): ModerationResult {
  const titleResult = moderateText(title);
  if (titleResult.flag) return titleResult;
  if (body) return moderateText(body);
  return { flag: false, reason: null };
}
