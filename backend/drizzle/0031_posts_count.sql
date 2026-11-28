-- Renommage métier : "tradition" devient "post" partout.
-- Les migrations historiques sont laissées intactes ; celle-ci porte le
-- changement de schéma et la migration des valeurs déjà stockées.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'traditions_count')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'posts_count') THEN
    ALTER TABLE "users" RENAME COLUMN "traditions_count" TO "posts_count";
  END IF;
END $$;

UPDATE "tribes" SET "topic" = 'posts' WHERE "topic" = 'traditions';

UPDATE "users"
SET "values" = (
  SELECT COALESCE(
    jsonb_agg(
      CASE
        WHEN e.value = '"tradition"'::jsonb THEN '"post"'::jsonb
        WHEN e.value = '"traditions"'::jsonb THEN '"posts"'::jsonb
        ELSE e.value
      END
      ORDER BY e.ord
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements("values") WITH ORDINALITY AS e(value, ord)
)
WHERE jsonb_typeof("values") = 'array'
  AND ("values" ? 'tradition' OR "values" ? 'traditions');

UPDATE "posts"
SET "tags" = (
  SELECT COALESCE(
    jsonb_agg(
      CASE
        WHEN e.value = '"tradition"'::jsonb THEN '"post"'::jsonb
        WHEN e.value = '"traditions"'::jsonb THEN '"posts"'::jsonb
        ELSE e.value
      END
      ORDER BY e.ord
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements("tags") WITH ORDINALITY AS e(value, ord)
)
WHERE jsonb_typeof("tags") = 'array'
  AND ("tags" ? 'tradition' OR "tags" ? 'traditions');

UPDATE "notifications"
SET "action" = replace("action", 'tradition', 'post')
WHERE "action" LIKE '%tradition%';

-- ── Rollback (à exécuter manuellement si besoin) ──────────────
-- ALTER TABLE "users" RENAME COLUMN "posts_count" TO "traditions_count";
-- UPDATE "tribes" SET "topic" = 'traditions' WHERE "topic" = 'posts';
-- UPDATE "notifications" SET "action" = replace("action", 'post', 'tradition');
-- (les tableaux jsonb peuvent être restaurés depuis une sauvegarde)
