-- Confidentialité de la position : défaut « friends » partout, et contrainte sur l'audience.
--
-- 1. La colonne `visibility` vaut déjà 'friends' par défaut depuis 0026 (réaffirmé ici, sans effet sur l'existant).
--    Mais drizzle/people-nearby-location.sql, hors journal, avait inséré une ligne 'nearby' pour tous les comptes
--    existants : ces comptes se retrouvaient visibles de tous les inconnus alors qu'ils n'avaient rien choisi.
ALTER TABLE user_location_settings ALTER COLUMN visibility SET DEFAULT 'friends';

-- 2. Repasse en 'friends' les lignes 'nearby' dont on peut PROUVER qu'elles n'ont jamais été modifiées :
--    - toutes les autres colonnes sont encore à leur valeur par défaut ;
--    - et leur `updated_at` est partagé par au moins 3 lignes : c'est l'horodatage d'une insertion en masse
--      (people-nearby-location.sql, un seul INSERT ... SELECT). Toute modification par l'utilisateur écrit un
--      `updated_at` individuel (new Date()), qui ne peut pas coïncider à la microseconde avec celui d'un lot.
--    LIMITE : une ligne 'nearby' créée seule (avant 0026) n'a pas d'horodatage de lot ; elle est indiscernable d'un
--    choix explicite de l'utilisateur et n'est donc PAS modifiée.
UPDATE user_location_settings s
SET visibility = 'friends'
WHERE s.visibility = 'nearby'
  AND s.precision = 'approximate'
  AND s.ghost_mode = FALSE
  AND s.show_distance = TRUE
  AND s.show_active_status = FALSE
  AND s.audience_mode = 'default'
  AND s.nearby_notify = FALSE
  AND s.expires_at IS NULL
  AND s.updated_at IN (
    SELECT updated_at FROM user_location_settings GROUP BY updated_at HAVING count(*) >= 3
  );

-- 3. audience_mode n'avait aucune contrainte (0022) : une valeur inconnue était lue comme « default » par le code,
--    mais la base l'acceptait. Valeurs invalides ramenées à 'default' (c'est déjà ainsi qu'elles sont interprétées),
--    puis CHECK ajouté de façon idempotente.
UPDATE user_location_settings SET audience_mode = 'default' WHERE audience_mode NOT IN ('default', 'selected', 'except');

DO $$
BEGIN
  ALTER TABLE user_location_settings
    ADD CONSTRAINT user_location_settings_audience_mode_check CHECK (audience_mode IN ('default', 'selected', 'except'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
