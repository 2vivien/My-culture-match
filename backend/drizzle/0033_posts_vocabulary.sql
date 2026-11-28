-- Migration de données : le vocabulaire stocké ("tradition") devient "post".
-- Le schéma n'est pas modifié ici (voir 0032_posts_count.sql).

-- Remplacements ciblés d'abord (tournures complètes), puis génériques.
UPDATE "posts"
SET "title" = 'Matsuri : quand les posts animent les rues'
WHERE "title" = 'Matsuri : quand la tradition anime les rues';

UPDATE "posts"
SET "text" = replace("text", 'nos fêtes traditionnelles africaines', 'nos posts sur les fêtes africaines')
WHERE "text" LIKE '%fêtes traditionnelles africaines%';

UPDATE "comments"
SET "text" = replace("text", 'Nos traditions se répondent', 'Nos posts se répondent')
WHERE "text" LIKE '%Nos traditions se répondent%';

-- Voyelle/majuscules : pluriel puis singulier, minuscule puis majuscule.
UPDATE "users"
SET "bio" = replace(replace(replace(replace("bio", 'traditions', 'posts'), 'Traditions', 'Posts'), 'tradition', 'post'), 'Tradition', 'Post')
WHERE "bio" LIKE '%tradition%' OR "bio" LIKE '%Tradition%';

UPDATE "posts"
SET "title" = replace(replace(replace(replace("title", 'traditions', 'posts'), 'Traditions', 'Posts'), 'tradition', 'post'), 'Tradition', 'Post')
WHERE "title" LIKE '%tradition%' OR "title" LIKE '%Tradition%';

UPDATE "posts"
SET "text" = replace(replace(replace(replace("text", 'traditions', 'posts'), 'Traditions', 'Posts'), 'tradition', 'post'), 'Tradition', 'Post')
WHERE "text" LIKE '%tradition%' OR "text" LIKE '%Tradition%';

UPDATE "posts"
SET "body" = replace(replace(replace(replace("body", 'traditions', 'posts'), 'Traditions', 'Posts'), 'tradition', 'post'), 'Tradition', 'Post')
WHERE "body" LIKE '%tradition%' OR "body" LIKE '%Tradition%';

UPDATE "comments"
SET "text" = replace(replace(replace(replace("text", 'traditions', 'posts'), 'Traditions', 'Posts'), 'tradition', 'post'), 'Tradition', 'Post')
WHERE "text" LIKE '%tradition%' OR "text" LIKE '%Tradition%';

UPDATE "messages"
SET "text" = replace(replace(replace(replace("text", 'traditions', 'posts'), 'Traditions', 'Posts'), 'tradition', 'post'), 'Tradition', 'Post')
WHERE "text" LIKE '%tradition%' OR "text" LIKE '%Tradition%';

UPDATE "tribes"
SET "desc" = replace(replace(replace(replace("desc", 'traditions', 'posts'), 'Traditions', 'Posts'), 'tradition', 'post'), 'Tradition', 'Post')
WHERE "desc" LIKE '%tradition%' OR "desc" LIKE '%Tradition%';

UPDATE "notifications"
SET "action" = replace(replace(replace(replace("action", 'traditions', 'posts'), 'Traditions', 'Posts'), 'tradition', 'post'), 'Tradition', 'Post')
WHERE "action" LIKE '%tradition%' OR "action" LIKE '%Tradition%';

-- ── Rollback : restaurer depuis une sauvegarde (remplacement non biojectif) ──
