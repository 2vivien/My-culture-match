import { describe, expect, it } from 'vitest';
import { checkMigrations, compressRanges } from '../../../scripts/check-migrations';

const entry = (idx: number, tag: string, when: number) => ({ idx, version: '7', when, tag, breakpoints: true });
const GOOD_ENTRIES = [entry(0, '0000_init', 1000), entry(1, '0001_users', 2000), entry(2, '0002_posts', 3000)];
const GOOD_FILES = ['0000_init.sql', '0001_users.sql', '0002_posts.sql'];
const run = (entries: unknown[], sqlFiles: string[], snapshotFiles?: string[]) =>
  checkMigrations({ journal: { version: '7', dialect: 'postgresql', entries }, sqlFiles, snapshotFiles });

describe('checkMigrations', () => {
  it('accepte un dossier cohérent', () => {
    expect(run(GOOD_ENTRIES, GOOD_FILES)).toEqual({ errors: [], warnings: [] });
  });

  it('ignore les .sql non numérotés (scripts ponctuels)', () => {
    expect(run(GOOD_ENTRIES, [...GOOD_FILES, 'people-nearby-location.sql']).errors).toEqual([]);
  });

  it('refuse un journal illisible', () => {
    expect(checkMigrations({ journal: null, sqlFiles: [] }).errors[0]).toMatch(/illisible/);
    expect(checkMigrations({ journal: { entries: 'x' }, sqlFiles: [] }).errors[0]).toMatch(/illisible/);
  });

  it('détecte un idx non contigu ou qui ne suit pas la position', () => {
    const errors = run([entry(0, '0000_init', 1000), entry(2, '0002_posts', 3000)], ['0000_init.sql', '0002_posts.sql']).errors;
    expect(errors.some((e) => /idx 2 ne correspond pas à sa position 1/.test(e))).toBe(true);
  });

  it('détecte un idx en double', () => {
    const errors = run([entry(0, '0000_init', 1000), entry(0, '0001_users', 2000)], ['0000_init.sql', '0001_users.sql']).errors;
    expect(errors.some((e) => /idx 0 en double/.test(e))).toBe(true);
  });

  it('détecte un numéro de tag différent de idx', () => {
    const errors = run([entry(0, '0000_init', 1000), entry(1, '0005_users', 2000)], ['0000_init.sql', '0005_users.sql']).errors;
    expect(errors.some((e) => /numéro du tag \(0005\) diffère de idx \(1\)/.test(e))).toBe(true);
  });

  it('détecte un `when` non strictement croissant (égal ou en recul)', () => {
    const equal = run([entry(0, '0000_init', 1000), entry(1, '0001_users', 1000)], ['0000_init.sql', '0001_users.sql']).errors;
    expect(equal.some((e) => /0001_users.*strictement supérieur/.test(e))).toBe(true);
    const back = run([entry(0, '0000_init', 5000), entry(1, '0001_users', 4000)], ['0000_init.sql', '0001_users.sql']).errors;
    expect(back.some((e) => /strictement supérieur/.test(e))).toBe(true);
  });

  it('détecte un `when` invalide', () => {
    const errors = run([{ ...entry(0, '0000_init', 1000), when: 'hier' }], ['0000_init.sql']).errors;
    expect(errors.some((e) => /horodatage/.test(e))).toBe(true);
  });

  it('détecte un tag du journal sans fichier .sql', () => {
    const errors = run(GOOD_ENTRIES, ['0000_init.sql', '0001_users.sql']).errors;
    expect(errors).toContain('0002_posts : présent dans le journal mais fichier 0002_posts.sql introuvable');
  });

  it('détecte un fichier .sql numéroté absent du journal', () => {
    const errors = run(GOOD_ENTRIES, [...GOOD_FILES, '0003_orpheline.sql']).errors;
    expect(errors.some((e) => /0003_orpheline\.sql : fichier absent du journal/.test(e))).toBe(true);
  });

  it('détecte deux fichiers avec le même numéro (collision entre branches)', () => {
    const errors = run(GOOD_ENTRIES, [...GOOD_FILES, '0002_autre.sql']).errors;
    expect(errors.some((e) => /numéro 0002 utilisé par plusieurs fichiers : 0002_autre, 0002_posts/.test(e))).toBe(true);
  });

  it('détecte un numéro dupliqué dans le journal', () => {
    const errors = run([entry(0, '0000_init', 1000), entry(1, '0000_bis', 2000)], ['0000_init.sql', '0000_bis.sql']).errors;
    expect(errors.some((e) => /numéro 0000 en double dans le journal/.test(e))).toBe(true);
  });

  it('détecte un tag en double et un tag mal formé', () => {
    expect(run([entry(0, '0000_init', 1000), entry(1, '0000_init', 2000)], ['0000_init.sql']).errors.some((e) => /tag 0000_init en double/.test(e))).toBe(true);
    expect(run([entry(0, 'init', 1000)], []).errors.some((e) => /tag invalide/.test(e))).toBe(true);
  });

  it('signale les snapshots manquants en avertissement, pas en erreur', () => {
    const res = run(GOOD_ENTRIES, GOOD_FILES, ['0000_snapshot.json']);
    expect(res.errors).toEqual([]);
    expect(res.warnings).toEqual([expect.stringContaining('0001-0002')]);
  });

  it('refuse un snapshot sans migration correspondante', () => {
    const res = run(GOOD_ENTRIES, GOOD_FILES, ['0000_snapshot.json', '0001_snapshot.json', '0002_snapshot.json', '0009_snapshot.json']);
    expect(res.errors.some((e) => /0009_snapshot\.json : snapshot sans migration/.test(e))).toBe(true);
  });

  it('un journal vide sans fichier est cohérent', () => {
    expect(run([], [])).toEqual({ errors: [], warnings: [] });
  });
});

describe('compressRanges', () => {
  it('regroupe les numéros consécutifs', () => {
    expect(compressRanges(['0011', '0012', '0013', '0020', '0022', '0023'])).toBe('0011-0013, 0020, 0022-0023');
    expect(compressRanges([])).toBe('');
    expect(compressRanges(['0005'])).toBe('0005');
  });
});
