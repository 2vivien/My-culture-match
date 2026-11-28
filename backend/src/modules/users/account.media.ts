/**
 * Recensement et suppression des fichiers d'un compte supprimé (MinIO) — logique PURE.
 * Aucun import de base, de Redis ni de MinIO : le stockage est injecté, ce qui rend le tout testable.
 *
 * Principe de sécurité : on ne supprime JAMAIS qu'un objet
 *   1. situé dans le bucket de l'application (URL externe ou autre bucket : ignoré) ;
 *   2. placé sous `<finalité>/<userId>/<fichier>` (clé générée par POST /api/uploads/request), donc appartenant
 *      à la personne — une URL collée vers le fichier d'un tiers n'est pas supprimée ;
 *   3. dont la clé ne contient aucun segment `.`/`..`, vide, antislash ou caractère de contrôle.
 */

/** Finalités d'upload (cf. UPLOAD_PURPOSES) : premier segment de la clé d'objet. */
export const OWNED_PURPOSES = ['avatar', 'story', 'post', 'voice', 'file'] as const;
export type OwnedPurpose = (typeof OWNED_PURPOSES)[number];

const USER_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const FILE_NAME_RE = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,199}$/;
const MAX_KEY_LENGTH = 1024;
const MAX_REMOVE_BATCH = 500;

export interface MediaOriginOptions {
  endpoint: string;
  port: number;
  useSSL: boolean;
  bucket: string;
  /** URL publique éventuelle (CDN, domaine dédié), avec ou sans chemin : `https://cdn.exemple.com/mcm-media`. */
  publicBaseUrl?: string | null;
}

/** Bases d'URL (origine + préfixe de chemin, sans `/` final) sous lesquelles vivent les objets du bucket. */
export function buildMediaBases(opts: MediaOriginOptions): string[] {
  const bases = new Set<string>();
  try {
    const direct = new URL(`${opts.useSSL ? 'https' : 'http'}://${opts.endpoint}:${opts.port}`);
    bases.add(`${direct.origin}/${encodeURIComponent(opts.bucket)}`);
  } catch {
    /* endpoint invalide : aucune base directe */
  }
  const pub = opts.publicBaseUrl?.trim();
  if (pub) {
    try {
      const u = new URL(pub);
      if (u.protocol === 'http:' || u.protocol === 'https:') bases.add(`${u.origin}${u.pathname.replace(/\/+$/, '')}`);
    } catch {
      /* URL publique invalide : ignorée */
    }
  }
  return [...bases];
}

export function isValidUserId(userId: unknown): userId is string {
  return typeof userId === 'string' && USER_ID_RE.test(userId);
}

/** Vrai si `key` est exactement `<finalité>/<userId>/<fichier>` ou `thumbs/<finalité>/<userId>/<fichier>`. */
export function isOwnedObjectKey(key: string, userId: string): boolean {
  if (!isValidUserId(userId)) return false;
  if (typeof key !== 'string' || key.length === 0 || key.length > MAX_KEY_LENGTH) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(key)) return false;
  const segments = key.split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..')) return false;
  const body = segments[0] === 'thumbs' ? segments.slice(1) : segments;
  if (body.length !== 3) return false;
  const [purpose, owner, file] = body as [string, string, string];
  return (OWNED_PURPOSES as readonly string[]).includes(purpose) && owner === userId && FILE_NAME_RE.test(file);
}

/**
 * Extrait la clé d'objet d'une URL (ou d'une clé nue) si, et seulement si, elle désigne un objet du bucket
 * de l'application appartenant à `userId`. Renvoie `null` dans tous les autres cas.
 */
export function objectKeyFromUrl(raw: unknown, userId: string, bases: readonly string[]): string | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  if (!value || value.length > 2048) return null;

  let key: string | null = null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return null;
    }
    if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) return null;
    const full = `${url.origin}${url.pathname}`;
    const base = bases.find((b) => full.startsWith(`${b}/`));
    if (!base) return null;
    try {
      key = decodeURIComponent(full.slice(base.length + 1));
    } catch {
      return null;
    }
  } else {
    // clé nue (ex. valeur issue de `objectKey`) : jamais de chemin absolu ni de requête
    if (value.startsWith('/') || /[?#]/.test(value)) return null;
    key = value;
  }
  return isOwnedObjectKey(key, userId) ? key : null;
}

/** Miniature générée par le worker média pour une finalité : `thumbs/<finalité>/<userId>/thumb.webp`. */
export function thumbKeyFor(purpose: string, userId: string): string {
  return `thumbs/${purpose}/${userId}/thumb.webp`;
}

/**
 * Recense les clés à supprimer à partir d'URLs lues en base (colonnes texte ou tableaux JSON, valeurs
 * quelconques tolérées). Dédoublonné, trié ; ajoute la miniature de chaque finalité rencontrée.
 */
export function collectOwnedObjectKeys(values: Iterable<unknown>, userId: string, bases: readonly string[]): string[] {
  const keys = new Set<string>();
  const purposes = new Set<string>();
  const visit = (v: unknown): void => {
    if (Array.isArray(v)) {
      v.forEach(visit);
      return;
    }
    const key = objectKeyFromUrl(v, userId, bases);
    if (key) {
      keys.add(key);
      purposes.add(key.split('/')[0] as string);
    }
  };
  for (const v of values) visit(v);
  for (const p of purposes) keys.add(thumbKeyFor(p, userId));
  return [...keys].sort();
}

/** Préfixes à balayer pour retrouver aussi les fichiers orphelins (anciens avatars remplacés, etc.). */
export function ownedPrefixes(userId: string): string[] {
  if (!isValidUserId(userId)) return [];
  return [
    ...OWNED_PURPOSES.map((p) => `${p}/${userId}/`),
    ...OWNED_PURPOSES.map((p) => `thumbs/${p}/${userId}/`),
  ];
}

// ── Exécution (stockage injecté) ───────────────────────────

export interface MediaCleanupJob {
  userId: string;
  /** Clés recensées en base avant la suppression du compte. */
  keys: string[];
}

export interface ObjectStorage {
  /** Liste les noms d'objets sous un préfixe. */
  list(prefix: string): Promise<string[]>;
  /** Supprime des objets (idempotent : un objet absent n'est pas une erreur). */
  remove(keys: string[]): Promise<void>;
}

export interface MediaCleanupResult {
  /** Objets pour lesquels la suppression a été demandée. */
  removed: number;
  /** Clés écartées car n'appartenant pas à la personne (défense en profondeur). */
  skipped: number;
}

/**
 * Supprime les objets de la personne : clés du job (re-validées) + tout ce qui se trouve sous ses préfixes.
 * Lève l'erreur du stockage (pour que BullMQ réessaie) ; relancer le job est sans danger.
 */
export async function runMediaCleanup(job: MediaCleanupJob, storage: ObjectStorage): Promise<MediaCleanupResult> {
  if (!isValidUserId(job.userId)) throw new Error('job de nettoyage invalide : identifiant');
  const targets = new Set<string>();
  let skipped = 0;
  for (const key of job.keys ?? []) {
    if (isOwnedObjectKey(key, job.userId)) targets.add(key);
    else skipped++;
  }
  for (const prefix of ownedPrefixes(job.userId)) {
    for (const name of await storage.list(prefix)) {
      if (isOwnedObjectKey(name, job.userId)) targets.add(name);
      else skipped++;
    }
  }
  const all = [...targets];
  for (let i = 0; i < all.length; i += MAX_REMOVE_BATCH) {
    await storage.remove(all.slice(i, i + MAX_REMOVE_BATCH));
  }
  return { removed: all.length, skipped };
}
