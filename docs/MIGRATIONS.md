# Migrations de base de données (Drizzle)

Dossier : `backend/drizzle/` · journal : `backend/drizzle/meta/_journal.json` · exécution : `backend/src/infrastructure/database/migrate.ts` (`npm run migrate:prod`, `drizzle-kit migrate` en local).

## Contrôle automatique

```bash
cd backend
npm run check:migrations
```

Le script `backend/scripts/check-migrations.ts` ne se connecte à aucune base. Il échoue (code 1) si :

- le journal est illisible, ou une entrée est mal formée (`idx`, `when`, `tag`) ;
- les `idx` ne sont pas contigus (`idx` = position dans le journal) ou ne correspondent pas au numéro du tag ;
- `when` n'est pas **strictement croissant** ;
- un tag du journal n'a pas de fichier `NNNN_nom.sql`, ou un `NNNN_nom.sql` n'est pas dans le journal ;
- deux migrations portent le même numéro (dans le journal ou parmi les fichiers) ;
- un snapshot `NNNN_snapshot.json` n'a pas de migration correspondante.

L'absence de snapshots est seulement signalée en avertissement (voir plus bas). Les `.sql` sans préfixe numérique (`people-nearby-*.sql`) sont des scripts ponctuels hors journal : ignorés. Le contrôle tourne dans la CI backend (job « Tests unitaires ») ; la logique pure est testée dans `backend/tests/unit/scripts/check-migrations.test.ts`.

## Convention d'écriture (migrations à la main)

Depuis la 0011, les migrations sont écrites à la main (SQL idempotent : `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS`…), sans `drizzle-kit generate`.

1. **Numéro** : le suivant disponible, sur 4 chiffres, nom en `snake_case` : `0028_ma_fonctionnalite.sql`. Avant de choisir, fusionner/rebaser sur `main` et lister `backend/drizzle/` : deux branches parallèles prennent facilement le même numéro (voir « Collisions »).
2. **Journal** : ajouter l'entrée à la fin de `_journal.json` :
   `{ "idx": 28, "version": "7", "when": 1790000009000, "tag": "0028_ma_fonctionnalite", "breakpoints": true }`
   - `idx` = numéro = position (0 pour la première) ;
   - `tag` = nom du fichier sans `.sql` ;
   - `when` = horodatage en millisecondes, **strictement supérieur** à celui de l'entrée précédente. C'est critique : le migrateur de Drizzle compare `when` au dernier `created_at` enregistré en base et **n'applique pas** une migration dont le `when` est inférieur ou égal. Une migration « en retard » est ignorée sans erreur sur les bases déjà migrées. Pratique actuelle : incrément de `1000` sur l'entrée précédente (les `when` des migrations écrites à la main sont des valeurs choisies, pas des dates réelles).
3. **Schéma TypeScript** : mettre à jour `schema.ts` (ou le `*.schema.ts` du module) pour qu'il reflète la migration.
4. `npm run check:migrations`.
5. **Instructions multiples** : séparer par `--> statement-breakpoint` si le journal a `"breakpoints": true` (le migrateur exécute chaque bloc séparément ; les fichiers DO/`$$` d'un seul bloc restent un seul statement).
6. **Ne jamais modifier** une migration déjà fusionnée/appliquée : en ajouter une nouvelle.

## Valider sur une base jetable

Sans toucher à une base partagée :

```bash
docker run --rm -d --name mcm-migr -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=mcm -p 55432:5432 postgres:16-alpine
export DATABASE_URL=postgresql://postgres:pw@localhost:55432/mcm?sslmode=disable
# + les autres variables obligatoires de src/config/env.ts (fournies par la CI ou votre environnement)
cd backend
npm run migrate        # applique tout le journal ; doit se terminer sans erreur
npm run migrate        # une 2e fois : doit rester sans effet (idempotence)
docker rm -f mcm-migr
```

Tester aussi le **chemin de mise à jour** : appliquer le journal de `main`, puis celui de la branche (les migrations nouvelles doivent s'appliquer par-dessus, ce qui valide la règle sur `when`). La CI d'intégration (`.github/workflows/ci.yml`) applique déjà `npm run migrate` sur un Postgres 16 neuf.

> Point d'attention : cette étape CI exécute aussi `npm run migrate:generate -- --name ci-check` avant `migrate`. Faute de snapshots après 0010, `generate` calcule l'écart depuis 0010 ; ce qu'il produit (et applique ensuite) n'est pas contrôlé ici. Le sujet est à traiter avec la régénération des snapshots ci-dessous (non modifié par cette PR).

## Collisions de numéros entre branches

Conflit de numéros résolu : `0020_posts_count` et `0021_posts_vocabulary` ont été renumérotées `0032_posts_count` / `0033_posts_vocabulary` (fichier, `tag`, `idx`, `when`). Le SQL de renommage est idempotent car ces migrations avaient déjà été appliquées sous leur ancien nom sur certaines bases.

## Pourquoi les snapshots manquent

`drizzle/meta/` contient `0000_snapshot.json` à `0010_snapshot.json` seulement. Les migrations 0011 et suivantes ont été écrites à la main (certaines créent des tables définies dans des `*.schema.ts` de modules ou via SQL brut, hors du `schema.ts` que lit `drizzle.config.ts`), donc aucun snapshot n'a été produit. Conséquences :

- `drizzle-kit generate` compare `schema.ts` au **dernier snapshot (0010)** : il voudrait régénérer sous forme de nouvelle migration tout ce qui a été ajouté depuis ;
- `drizzle-kit check` ne valide pas l'historique réel ;
- l'exécution des migrations (`migrate`) n'utilise **pas** les snapshots, seulement le journal et les `.sql` : la production n'est pas affectée.

Aucun faux snapshot n'a été fabriqué : un snapshot inexact ferait générer des migrations erronées (suppressions de tables, par exemple), ce qui est pire que son absence.

## Marche à suivre pour régénérer les snapshots (quand une base est disponible)

Procédure à valider lors de sa première exécution : elle n'a pas pu être testée faute de base dans l'environnement qui a produit ce document.

1. Créer une base jetable (voir ci-dessus) et y appliquer **tout** le journal (`npm run migrate`).
2. Vérifier que la base correspond au code : `drizzle-kit introspect` (ou `pull`) dans un dossier temporaire et comparer au schéma TypeScript. Faire entrer dans la configuration drizzle **tous** les fichiers de schéma (`schema.ts` + `modules/**/*.schema.ts`) via un tableau/glob dans `schema:` — sinon les tables des modules seraient vues comme à supprimer.
3. Travailler sur une **copie** du dossier `drizzle/` : lancer `drizzle-kit generate` avec cette configuration. Le SQL produit couvre l'écart 0010 → état actuel : **le jeter**. Ne conserver que le snapshot JSON obtenu et le placer sous le numéro de la dernière migration (`0019_snapshot.json`, ou la plus récente), avec `prevId` chaîné sur le `id` de `0010_snapshot.json`.
4. Pour les migrations intermédiaires 0011…N-1, soit générer un snapshot par étape en rejouant le schéma à chaque commit, soit documenter une rupture assumée (un seul snapshot « rebase » à N) et s'en tenir à des migrations générées à partir de là.
5. Vérifier : `drizzle-kit check` sans erreur, puis `drizzle-kit generate` **sans changement** (« nothing to migrate ») sur une base à jour. Lancer `npm run check:migrations` (les avertissements sur les snapshots disparaissent).
6. Relire le diff : aucun fichier `.sql` existant ni le `when` d'une entrée existante ne doit changer.
