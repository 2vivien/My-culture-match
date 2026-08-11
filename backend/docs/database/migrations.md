# Base de données — Migrations

## Outil

**Drizzle Kit** — migrations SQL générées depuis `schema.ts`.

```bash
# Générer une migration à partir des changements de schéma
npm run migrate:generate          # → drizzle/XXXX_name.sql

# Appliquer les migrations (ordre chronologique)
npm run migrate
```

- Le dossier de sortie est `drizzle/` (`drizzle.config.ts` : schema → `src/infrastructure/database/schema.ts`, dialect `postgresql`).
- En dev, la DB cible est celle de `DATABASE_URL` (docker-compose `postgres:16-alpine`).
- En prod : **jamais de migration manuelle** — uniquement via le pipeline CI (dry-run + apply).

## Workflow recommandé

1. Modifier `schema.ts`.
2. `npm run migrate:generate` → vérifier le SQL généré.
3. Tester localement avec `npm run migrate`.
4. En CI : `npm run migrate:generate -- --name ci-check` (valide que le schéma est cohérent) puis `npm run migrate`.

## Règles

- Toujours versionner les fichiers de migration générés.
- Un commit = une migration (ou zéro si le schéma n'a pas changé).
- Ne pas éditer à la main une migration déjà appliquée ; en créer une nouvelle.
- Backup Neon avant chaque migration de prod ; rollback = `drizzle-kit` via migration inverse documentée.

## Journal

Le journal de migrations est dans `drizzle/meta/` (ignoré par git : `_journal_*.json`).
La dernière migration est `0006_admin_moderation_culture_engine.sql` (MP14-16 : admin, modération, culture engine).
