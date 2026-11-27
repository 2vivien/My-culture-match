/**
 * Contrôle de cohérence du dossier de migrations Drizzle (journal + fichiers .sql) — sans base de données.
 *
 *   npm run check:migrations
 *
 * La logique (`checkMigrations`) est PURE : elle reçoit le journal et la liste des fichiers, ce qui la rend
 * testable unitairement. Seul le bloc `main` en bas lit le disque.
 * Voir docs/MIGRATIONS.md pour la convention.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface JournalEntry {
  idx: number;
  version?: string;
  when: number;
  tag: string;
  breakpoints?: boolean;
}

export interface Journal {
  version?: string;
  dialect?: string;
  entries: JournalEntry[];
}

export interface CheckInput {
  journal: unknown;
  /** Noms de fichiers présents dans `drizzle/` (sans chemin). */
  sqlFiles: string[];
  /** Noms de fichiers présents dans `drizzle/meta/` (facultatif : contrôle des snapshots). */
  snapshotFiles?: string[];
}

export interface CheckResult {
  errors: string[];
  warnings: string[];
}

/** Migrations numérotées : `NNNN_nom.sql`. Les autres .sql (scripts ponctuels) sont ignorés. */
const NUMBERED_SQL = /^(\d{4})_([A-Za-z0-9_]+)\.sql$/;
const TAG_RE = /^(\d{4})_([A-Za-z0-9_]+)$/;

export function checkMigrations(input: CheckInput): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const raw = input.journal as Partial<Journal> | null | undefined;
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.entries)) {
    return { errors: ['journal illisible : champ `entries` absent ou invalide'], warnings };
  }
  const entries = raw.entries as JournalEntry[];

  // 1. Forme de chaque entrée + numéro du tag
  const seenIdx = new Map<number, string>();
  const seenTag = new Map<string, number>();
  const seenNumber = new Map<string, string>();
  entries.forEach((e, pos) => {
    const where = `entrée #${pos}`;
    if (!e || typeof e !== 'object') {
      errors.push(`${where} : entrée invalide`);
      return;
    }
    if (!Number.isInteger(e.idx)) errors.push(`${where} (${e.tag}) : idx doit être un entier`);
    if (typeof e.when !== 'number' || !Number.isFinite(e.when) || e.when <= 0) errors.push(`${where} (${e.tag}) : \`when\` doit être un horodatage ms positif`);
    if (typeof e.tag !== 'string' || !TAG_RE.test(e.tag)) {
      errors.push(`${where} : tag invalide « ${String(e.tag)} » (attendu NNNN_nom)`);
      return;
    }

    if (seenIdx.has(e.idx)) errors.push(`idx ${e.idx} en double (${seenIdx.get(e.idx)} et ${e.tag})`);
    else seenIdx.set(e.idx, e.tag);

    if (seenTag.has(e.tag)) errors.push(`tag ${e.tag} en double dans le journal`);
    else seenTag.set(e.tag, e.idx);

    const num = e.tag.slice(0, 4);
    if (seenNumber.has(num)) errors.push(`numéro ${num} en double dans le journal (${seenNumber.get(num)} et ${e.tag})`);
    else seenNumber.set(num, e.tag);

    // 2. idx == position, numéro du tag == idx
    if (Number.isInteger(e.idx) && e.idx !== pos) errors.push(`${e.tag} : idx ${e.idx} ne correspond pas à sa position ${pos} (idx contigus requis)`);
    if (Number.isInteger(e.idx) && Number(num) !== e.idx) errors.push(`${e.tag} : le numéro du tag (${num}) diffère de idx (${e.idx})`);
  });

  // 3. `when` strictement croissant (le migrateur Drizzle n'applique que ce qui dépasse le dernier `when` appliqué)
  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1];
    const cur = entries[i];
    if (prev && cur && typeof prev.when === 'number' && typeof cur.when === 'number' && cur.when <= prev.when) {
      errors.push(`${cur.tag} : \`when\` (${cur.when}) doit être strictement supérieur à celui de ${prev.tag} (${prev.when}) — sinon la migration est ignorée sur les bases déjà migrées`);
    }
  }

  // 4. Journal <-> fichiers .sql
  const numberedFiles = input.sqlFiles.filter((f) => NUMBERED_SQL.test(f));
  const fileTags = new Set(numberedFiles.map((f) => f.replace(/\.sql$/, '')));
  for (const e of entries) {
    if (e && typeof e.tag === 'string' && TAG_RE.test(e.tag) && !fileTags.has(e.tag)) errors.push(`${e.tag} : présent dans le journal mais fichier ${e.tag}.sql introuvable`);
  }
  for (const tag of [...fileTags].sort()) {
    if (!seenTag.has(tag)) errors.push(`${tag}.sql : fichier absent du journal (drizzle-kit migrate l'ignorerait)`);
  }

  // 5. Numéros dupliqués côté fichiers (deux branches ayant pris le même numéro)
  const byNumber = new Map<string, string[]>();
  for (const tag of fileTags) {
    const n = tag.slice(0, 4);
    byNumber.set(n, [...(byNumber.get(n) ?? []), tag]);
  }
  for (const [n, tags] of [...byNumber].sort()) {
    if (tags.length > 1) errors.push(`numéro ${n} utilisé par plusieurs fichiers : ${tags.sort().join(', ')}`);
  }

  // 6. Snapshots (information : leur absence est connue et documentée, voir docs/MIGRATIONS.md)
  if (input.snapshotFiles) {
    const snaps = new Set(input.snapshotFiles);
    const missing = entries.filter((e) => e && TAG_RE.test(String(e.tag)) && !snaps.has(`${e.tag.slice(0, 4)}_snapshot.json`)).map((e) => e.tag.slice(0, 4));
    if (missing.length > 0) {
      warnings.push(`snapshots absents pour ${missing.length} migration(s) : ${compressRanges(missing)} (migrations écrites à la main, voir docs/MIGRATIONS.md)`);
    }
    for (const s of snaps) {
      const m = /^(\d{4})_snapshot\.json$/.exec(s);
      if (m && !seenNumber.has(m[1] as string)) errors.push(`${s} : snapshot sans migration correspondante dans le journal`);
    }
  }

  return { errors, warnings };
}

/** ["0011","0012","0013","0020"] -> "0011-0013, 0020" */
export function compressRanges(nums: string[]): string {
  const sorted = [...nums].map(Number).sort((a, b) => a - b);
  const out: string[] = [];
  let start: number | undefined;
  let prev: number | undefined;
  const pad = (n: number) => String(n).padStart(4, '0');
  const flush = () => {
    if (start === undefined || prev === undefined) return;
    out.push(start === prev ? pad(start) : `${pad(start)}-${pad(prev)}`);
  };
  for (const n of sorted) {
    if (prev !== undefined && n === prev + 1) {
      prev = n;
      continue;
    }
    flush();
    start = n;
    prev = n;
  }
  flush();
  return out.join(', ');
}

// ── CLI ────────────────────────────────────────────────────
function main(): number {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'drizzle');
  const journalPath = join(root, 'meta', '_journal.json');
  if (!existsSync(journalPath)) {
    console.error(`✗ journal introuvable : ${journalPath}`);
    return 1;
  }
  let journal: unknown;
  try {
    journal = JSON.parse(readFileSync(journalPath, 'utf8'));
  } catch (err) {
    console.error(`✗ journal JSON invalide : ${(err as Error).message}`);
    return 1;
  }
  const sqlFiles = readdirSync(root).filter((f) => f.endsWith('.sql'));
  const metaDir = join(root, 'meta');
  const snapshotFiles = readdirSync(metaDir).filter((f) => f.endsWith('_snapshot.json'));

  const { errors, warnings } = checkMigrations({ journal, sqlFiles, snapshotFiles });
  for (const w of warnings) console.warn(`! ${w}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`✗ ${e}`);
    console.error(`\n${errors.length} erreur(s) — voir docs/MIGRATIONS.md`);
    return 1;
  }
  const count = (journal as Journal).entries.length;
  console.log(`✓ migrations cohérentes (${count} entrées au journal)`);
  return 0;
}

const invokedDirectly = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) process.exit(main());
