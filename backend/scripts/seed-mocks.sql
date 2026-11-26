-- ─────────────────────────────────────────────────────────────
-- Seed de démonstration My Culture Match (profil + posts)
-- Run: docker exec -i mcm_postgres psql -U mcm -d mcm < backend/scripts/seed-mocks.sql
-- Puis: npm --prefix backend run seed:feed (réchauffe le feed following Redis)
-- Idempotent : ON CONFLICT DO NOTHING / gardes NOT EXISTS.
-- Les users de test déjà présents sont réutilisés, pas dupliqués.
-- ─────────────────────────────────────────────────────────────

-- 0) Users de test : créés seulement s'ils n'existent pas encore.
INSERT INTO users (
  id, email, email_verified, name, username, country, region, location,
  bio, languages, roots, intention, profile_completed, level, glow
)
SELECT v.id, v.email, true, v.name, v.username, v.country, v.region, v.location,
       v.bio::text, v.languages::jsonb, v.roots::jsonb, v.intention, true, v.level, v.glow::glow
FROM (VALUES
  (md5('seed-user-vivien'), 'seed-vivien@example.invalid', 'vivien Agueounde', 'agueoundev3443',
   'BJ', 'Atlantique', 'Cotonou, Bénin',
   'Bienvenue sur mon profil 🌍 Je partage les posts du Bénin : la cuisine, les rites Vodun, le Zangbeto et les histoires de nos anciens.',
   '["Français","Fon","Yoruba","Anglais"]', '["Bénin","Afrique de l''Ouest"]', 'Cultural Exchange', 12, 'orange'),
  (md5('seed-user-aicha'), 'seed-aicha@example.invalid', 'Aïcha', 'aicha-seed',
   'SN', 'Dakar', 'Dakar, Sénégal',
   'Griotte & musicienne. La kora est ma voix, la mémoire de mes ancêtres mon carnet de chants.',
   '["Français","Wolof","Anglais"]', '["Sénégal","Afrique de l''Ouest"]', 'Cultural Exchange', 9, 'turquoise'),
  (md5('seed-user-awa'), 'seed-awa@example.invalid', 'Awa', 'awa-seed',
   'CM', 'Littoral', 'Douala, Cameroun',
   'Créatrice wax et amoureuse des tissus africains. Je partage mes ateliers et mes inspirations.',
   '["Français","Douala","Anglais"]', '["Cameroun"]', 'Cultural Exchange', 15, 'violet'),
  (md5('seed-user-yamato'), 'seed-yamato@example.invalid', 'Yamato', 'yamato-seed',
   'JP', 'Kansai', 'Osaka, Japon',
   'Japonais curieux des cultures du monde. Matsuri, kora et igname pilée : je collectionne les découvertes.',
   '["Japonais","Anglais","Français"]', '["Japon"]', 'Cultural Exchange', 18, 'emerald'),
  (md5('seed-user-autre'), 'seed-autre@example.invalid', 'Autre', 'autre-seed',
   'CI', 'Abidjan', 'Abidjan, Côte d''Ivoire',
   'Griot et conteur. La mémoire orale se transmet encore, venez en parler ici.',
   '["Français","Dioula"]', '["Côte d''Ivoire"]', 'Cultural Exchange', 7, 'amber')
) AS v(id, email, name, username, country, region, location, bio, languages, roots, intention, level, glow)
WHERE NOT EXISTS (
  SELECT 1 FROM users u
  WHERE u.name = v.name OR u.username = v.username OR u.email = v.email
);

-- 0) Enrich vivien's profile so flags/bio/heritage are not empty
UPDATE users SET
  country   = 'BJ',
  region    = 'Atlantique',
  location  = 'Cotonou, Bénin',
  bio       = 'Bienvenue sur mon profil 🌍 Je partage les posts du Bénin : la cuisine, les rites Vodun, le Zangbeto et les histoires de nos anciens. Ici on échange, on apprend et on transmet.',
  languages = '["Français","Fon","Yoruba","Anglais"]'::jsonb,
  roots     = '["Bénin","Afrique de l''Ouest"]'::jsonb,
  intention = 'Cultural Exchange'
WHERE username = 'agueoundev3443';

-- Pick the current user
CREATE TEMP TABLE _me AS
  SELECT id FROM users WHERE username = 'agueoundev3443' LIMIT 1;

-- Other mock users referenced below (first match of each)
CREATE TEMP TABLE _aicha AS SELECT id FROM users WHERE name = 'Aïcha' ORDER BY created_at LIMIT 1;
CREATE TEMP TABLE _awa   AS SELECT id FROM users WHERE name = 'Awa'   ORDER BY created_at LIMIT 1;
CREATE TEMP TABLE _yamato AS SELECT id FROM users WHERE name = 'Yamato' ORDER BY created_at LIMIT 1;
CREATE TEMP TABLE _autre AS SELECT id FROM users WHERE name = 'Autre' ORDER BY created_at LIMIT 1;

-- Give the mock users countries & avatars so flags show everywhere
UPDATE users SET country = 'SN', location = 'Dakar, Sénégal' WHERE id IN (SELECT id FROM _aicha) AND (country IS NULL OR country = '');
UPDATE users SET country = 'CM', location = 'Douala, Cameroun' WHERE id IN (SELECT id FROM _awa) AND (country IS NULL OR country = '');
UPDATE users SET country = 'JP', location = 'Osaka, Japon' WHERE id IN (SELECT id FROM _yamato) AND (country IS NULL OR country = '');
UPDATE users SET country = 'CI', location = 'Abidjan, Côte d''Ivoire' WHERE id IN (SELECT id FROM _autre) AND (country IS NULL OR country = '');

-- ── 1) Tribes owned by vivien ────────────────────────────────
INSERT INTO tribes (id, name, tag, topic, "desc", created_by_id, member_count, visitors, created_at)
VALUES
  (md5('seed-tribe-zangbeto'), 'Gardiens du Zangbeto', 'zangbeto', 'posts', 'Le Nightwatcher veille : partagez légendes, rites et masks du Golfe du Bénin.', (SELECT id FROM _me), 128, 1204, now() - interval '20 days'),
  (md5('seed-tribe-saveurs'), 'Saveurs du Bénin', 'saveurs-benin', 'cuisine', 'Pâte, sauce graine, Igname pilée : nos recettes de famille, étape par étape.', (SELECT id FROM _me), 86, 540, now() - interval '12 days'),
  (md5('seed-tribe-diaspora'), 'Diaspora 229 🌍', 'diaspora-229', 'voyage', 'Les Béninois du monde entier : retours au pays, visa, conseils et rencontres.', (SELECT id FROM _me), 243, 1890, now() - interval '5 days')
ON CONFLICT DO NOTHING;

-- ── 2) Tribes owned by others ────────────────────────────────
INSERT INTO tribes (id, name, tag, topic, "desc", created_by_id, member_count, visitors, created_at)
VALUES
  (md5('seed-tribe-kora'), 'Kora & Cordes', 'kora-cordes', 'musique', 'Tout sur la kora, le balafon et les nwest sons afro-folk.', (SELECT id FROM _aicha), 512, 3021, now() - interval '60 days'),
  (md5('seed-tribe-wax'), 'Wax & Style', 'wax-style', 'mode', 'Le pagne wax dans tous ses états : couture, histoire et tendances.', (SELECT id FROM _awa), 340, 2100, now() - interval '40 days'),
  (md5('seed-tribe-anime'), 'Anime & Mangas', 'anime-mangas', 'cinema', 'Otaku d''Afrique et d''ailleurs : débats, recommandations et cosplays.', (SELECT id FROM _yamato), 780, 5300, now() - interval '90 days')
ON CONFLICT DO NOTHING;

-- Memberships
INSERT INTO tribe_members (tribe_id, user_id, role, joined_at)
SELECT id, (SELECT id FROM _me), 'owner'::tribe_role, now() - interval '20 days' FROM tribes WHERE id = md5('seed-tribe-zangbeto')
UNION ALL SELECT id, (SELECT id FROM _me), 'owner'::tribe_role, now() - interval '12 days' FROM tribes WHERE id = md5('seed-tribe-saveurs')
UNION ALL SELECT id, (SELECT id FROM _me), 'owner'::tribe_role, now() - interval '5 days'  FROM tribes WHERE id = md5('seed-tribe-diaspora')
UNION ALL SELECT id, (SELECT id FROM _aicha), 'owner'::tribe_role, now() - interval '60 days' FROM tribes WHERE id = md5('seed-tribe-kora')
UNION ALL SELECT id, (SELECT id FROM _me), 'member'::tribe_role, now() - interval '30 days' FROM tribes WHERE id = md5('seed-tribe-kora')
UNION ALL SELECT id, (SELECT id FROM _awa), 'owner'::tribe_role, now() - interval '40 days' FROM tribes WHERE id = md5('seed-tribe-wax')
UNION ALL SELECT id, (SELECT id FROM _me), 'member'::tribe_role, now() - interval '10 days' FROM tribes WHERE id = md5('seed-tribe-wax')
UNION ALL SELECT id, (SELECT id FROM _yamato), 'owner'::tribe_role, now() - interval '90 days' FROM tribes WHERE id = md5('seed-tribe-anime')
ON CONFLICT DO NOTHING;

-- ── 3) Posts ─────────────────────────────────────────────────
INSERT INTO posts (id, author_id, tribe_id, type, title, text, body, tags, likes, comments, views, saves, shares, created_at)
VALUES
  (md5('seed-post-1'), (SELECT id FROM _me), md5('seed-tribe-zangbeto'), 'Text', 'La nuit du Zangbeto à Ouidah', 'Chaque année, la nuit du Zangbeto transforme Ouidah. Le mask tourne, les tambours parlent… Qui a déjà vécu cette nuit magique ? Racontez !', NULL, '["zangbeto","ouidah","vodun"]'::jsonb, 42, 5, 812, 11, 4, now() - interval '3 days'),
  (md5('seed-post-2'), (SELECT id FROM _me), NULL, 'Images', 'Ma sauce graine sans graine… mais avec âme 🍲', 'Version diaspora de la sauce graine : épices de Cotonou + patience de maman. La recette complète dans les commentaires !', NULL, '["cuisine","diaspora","recette"]'::jsonb, 67, 3, 1240, 23, 9, now() - interval '2 days'),
  (md5('seed-post-3'), (SELECT id FROM _me), md5('seed-tribe-saveurs'), 'Text', 'Le igname pilée parfait : vos secrets ?', 'Force du pilon, temps de repos, choix de l''igname… Quels sont vos trucs de famille pour un igname pilée qui se tient ?', NULL, '["igname","post"]'::jsonb, 28, 3, 430, 6, 2, now() - interval '1 day'),
  (md5('seed-post-4'), (SELECT id FROM _awa), md5('seed-tribe-wax'), 'Images', 'Nouvelle collection wax inspirée du Zangbeto', 'Trois mois de travail avec les artisans de Douala pour cette collection. Dîtes-moi ce que vous en pensez !', NULL, '["wax","mode","artisans"]'::jsonb, 154, 2, 3420, 45, 21, now() - interval '4 hours'),
  (md5('seed-post-5'), (SELECT id FROM _aicha), md5('seed-tribe-kora'), 'Link', 'La kora dans la musique moderne', 'Un bel article sur la renaissance de la kora dans l''afro-folk. Le son est incroyable.', 'https://example.com/kora-afro-folk', '["kora","musique"]'::jsonb, 89, 2, 1540, 18, 7, now() - interval '8 hours'),
  (md5('seed-post-6'), (SELECT id FROM _yamato), NULL, 'Text', 'Matsuri : quand les posts animent les rues', 'Au Japon, les festivals Matsuri rassemblent des villes entières. Les parallèles avec nos posts sur les fêtes africaines sont étonnants.', NULL, '["matsuri","japon","festival"]'::jsonb, 203, 1, 5210, 67, 30, now() - interval '20 hours'),
  (md5('seed-post-7'), (SELECT id FROM _me), md5('seed-tribe-diaspora'), 'Text', 'Checklist du retour au pays 🇧🇯', 'De la douane de Cadjèhoun au glory de Fidjrossè : ma checklist complète pour un retour au bercail réussi. Complétez avec vos astuces !', NULL, '["diaspora","voyage","benin"]'::jsonb, 35, 2, 940, 12, 5, now() - interval '10 hours'),
  (md5('seed-post-8'), (SELECT id FROM _autre), NULL, 'Text', 'Le griot et la mémoire des villages', 'Chez nous, le griot n''est pas un artiste : c''est une bibliothèque vivante. Partagez comment la mémoire orale se transmet chez vous.', NULL, '["griot","histoire","oralite"]'::jsonb, 51, 1, 780, 8, 3, now() - interval '30 hours')
ON CONFLICT DO NOTHING;

-- Rafraîchit les dates des posts seed : Home utilise le filtre "for-you"
-- qui ne garde que les 7 derniers jours (un seed rejoué plus tard resterait vide).
UPDATE posts p
SET created_at = v.created_at, updated_at = now()
FROM (VALUES
  (md5('seed-post-1'), now() - interval '3 days'),
  (md5('seed-post-2'), now() - interval '2 days'),
  (md5('seed-post-3'), now() - interval '1 day'),
  (md5('seed-post-4'), now() - interval '4 hours'),
  (md5('seed-post-5'), now() - interval '8 hours'),
  (md5('seed-post-6'), now() - interval '20 hours'),
  (md5('seed-post-7'), now() - interval '10 hours'),
  (md5('seed-post-8'), now() - interval '30 hours')
) AS v(id, created_at)
WHERE p.id = v.id;

-- ── 4) Comments (with replies) ───────────────────────────────
INSERT INTO comments (id, post_id, user_id, text, likes, created_at)
VALUES
  (md5('seed-c1'), md5('seed-post-1'), (SELECT id FROM _awa), 'Magnifique ! J''ai assisté au Zangbeto il y a 2 ans, frissons garantis 😍', 12, now() - interval '2 days'),
  (md5('seed-c1r1'), md5('seed-post-1'), (SELECT id FROM _me), 'Merci ! Oui, la première fois c''est un moment inoubliable 🙏', 5, now() - interval '2 days' + interval '1 hour'),
  (md5('seed-c1r2'), md5('seed-post-1'), (SELECT id FROM _yamato), 'Les parallèles avec nos festivals Nocturnes au Japon sont frappants.', 3, now() - interval '2 days' + interval '2 hours'),
  (md5('seed-c2'), md5('seed-post-1'), (SELECT id FROM _aicha), 'J''ai entendu les tambours depuis la plage, c''était mystique 🔥', 8, now() - interval '1 day'),
  (md5('seed-c3'), md5('seed-post-2'), (SELECT id FROM _aicha), 'La recette stp ! Ma grand-mère ne m''a jamais donné les doses 😅', 15, now() - interval '1 day'),
  (md5('seed-c3r1'), md5('seed-post-2'), (SELECT id FROM _me), 'Comment top ! Je poste la liste des épices ce soir 😊', 7, now() - interval '1 day' + interval '3 hours'),
  (md5('seed-c3r2'), md5('seed-post-2'), (SELECT id FROM _awa), 'Je plussoie, le secret c''est la cuisson lente !', 4, now() - interval '20 hours'),
  (md5('seed-c4'), md5('seed-post-3'), (SELECT id FROM _yamato), 'Jamais testé mais ça donne faim 🤤', 2, now() - interval '12 hours'),
  (md5('seed-c5'), md5('seed-post-4'), (SELECT id FROM _me), 'Waouh, le deuxième modèle est somptueux ! Bravo 👏', 9, now() - interval '3 hours'),
  (md5('seed-c6'), md5('seed-post-5'), (SELECT id FROM _autre), 'La kora est un instrument divin, merci pour le partage.', 6, now() - interval '6 hours'),
  (md5('seed-c7'), md5('seed-post-6'), (SELECT id FROM _me), 'Excellent parallèle ! Nos posts se répondent à travers le monde.', 10, now() - interval '15 hours'),
  (md5('seed-c8'), md5('seed-post-7'), (SELECT id FROM _aicha), 'Super liste ! Ajoute le marché Dantokpa tôt le matin, ça vaut le détour 🌅', 5, now() - interval '8 hours'),
  (md5('seed-c8r1'), md5('seed-post-7'), (SELECT id FROM _me), 'Vrai ! Et négocier avec le sourire, ça marche à tous les coups 😄', 3, now() - interval '7 hours'),
  (md5('seed-c9'), md5('seed-post-7'), (SELECT id FROM _yamato), 'La partie visa est très utile, merci !', 2, now() - interval '5 hours'),
  (md5('seed-c10'), md5('seed-post-8'), (SELECT id FROM _me), 'Magnifiquement dit. Chez nous aussi, les veillées comptent énormément.', 7, now() - interval '20 hours'),
  (md5('seed-c11'), md5('seed-post-5'), (SELECT id FROM _me), 'Ce son de kora me happe dès les premières secondes 🎶', 4, now() - interval '4 hours'),
  (md5('seed-c11r1'), md5('seed-post-5'), (SELECT id FROM _aicha), 'Alors écoute l''album de Sona Jobarteh, tu vas adorer !', 6, now() - interval '3 hours')
ON CONFLICT DO NOTHING;

-- Replies linked to parents
UPDATE comments SET parent_id = md5('seed-c1') WHERE id = md5('seed-c1r1');
UPDATE comments SET parent_id = md5('seed-c1') WHERE id = md5('seed-c1r2');
UPDATE comments SET parent_id = md5('seed-c3') WHERE id = md5('seed-c3r1');
UPDATE comments SET parent_id = md5('seed-c3') WHERE id = md5('seed-c3r2');
UPDATE comments SET parent_id = md5('seed-c8') WHERE id = md5('seed-c8r1');
UPDATE comments SET parent_id = md5('seed-c11') WHERE id = md5('seed-c11r1');

-- Sync denormalized comment counts
UPDATE posts SET comments = (
  SELECT count(*) FROM comments c WHERE c.post_id = posts.id
) WHERE id IN (md5('seed-post-1'), md5('seed-post-2'), md5('seed-post-3'), md5('seed-post-4'), md5('seed-post-5'), md5('seed-post-6'), md5('seed-post-7'), md5('seed-post-8'));

-- ── 5) Conversations + messages ──────────────────────────────
INSERT INTO conversations (id, is_group, created_by_id, last_message_at, created_at)
VALUES
  (md5('seed-convo-awa'), false, (SELECT id FROM _me), now() - interval '35 minutes', now() - interval '6 days'),
  (md5('seed-convo-aicha'), false, (SELECT id FROM _me), now() - interval '2 hours', now() - interval '4 days'),
  (md5('seed-convo-yamato'), false, (SELECT id FROM _me), now() - interval '1 day', now() - interval '3 days')
ON CONFLICT DO NOTHING;

INSERT INTO conversation_participants (conversation_id, user_id, unread_count, joined_at)
SELECT md5('seed-convo-awa'), (SELECT id FROM _me), 2, now() - interval '6 days'
UNION ALL SELECT md5('seed-convo-awa'), (SELECT id FROM _awa), 0, now() - interval '6 days'
UNION ALL SELECT md5('seed-convo-aicha'), (SELECT id FROM _me), 1, now() - interval '4 days'
UNION ALL SELECT md5('seed-convo-aicha'), (SELECT id FROM _aicha), 0, now() - interval '4 days'
UNION ALL SELECT md5('seed-convo-yamato'), (SELECT id FROM _me), 0, now() - interval '3 days'
UNION ALL SELECT md5('seed-convo-yamato'), (SELECT id FROM _yamato), 0, now() - interval '3 days'
ON CONFLICT DO NOTHING;

INSERT INTO messages (id, conversation_id, sender_id, type, text, is_read, created_at)
VALUES
  (md5('seed-m1'),  md5('seed-convo-awa'), (SELECT id FROM _awa), 'text', 'Salut vivien ! Ta tribu Diaspora 229 est top 🙌', true,  now() - interval '6 days'),
  (md5('seed-m2'),  md5('seed-convo-awa'), (SELECT id FROM _me), 'text', 'Merci Awa ! Ça me fait plaisir, tu veux rejoindre ?', true,  now() - interval '6 days' + interval '10 minutes'),
  (md5('seed-m3'),  md5('seed-convo-awa'), (SELECT id FROM _awa), 'text', 'Avec plaisir ! Tu recommandes quel quartier pour un retour au pays ?', true,  now() - interval '5 days'),
  (md5('seed-m4'),  md5('seed-convo-awa'), (SELECT id FROM _me), 'text', 'Cotonou sans hésiter — Fidjrossè pour la plage, Akpakpa pour la vraie vie 😉', true,  now() - interval '5 days' + interval '15 minutes'),
  (md5('seed-m5'),  md5('seed-convo-awa'), (SELECT id FROM _awa), 'text', 'Noté ! Et pour la cuisine, tu connais un bon spot pour la sauce graine ?', false, now() - interval '40 minutes'),
  (md5('seed-m6'),  md5('seed-convo-awa'), (SELECT id FROM _awa), 'text', 'Parce que j''ai un gros caprice là 😅', false, now() - interval '35 minutes'),
  (md5('seed-m7'),  md5('seed-convo-aicha'), (SELECT id FROM _aicha), 'text', 'Bonjour ! J''ai vu ton post sur le Zangbeto, c''était toi le photographe ?', true,  now() - interval '4 days'),
  (md5('seed-m8'),  md5('seed-convo-aicha'), (SELECT id FROM _me), 'text', 'Oui c''était moi ! Le mask tourne tellement vite, pas simple à capturer 😄', true,  now() - interval '4 days' + interval '20 minutes'),
  (md5('seed-m9'),  md5('seed-convo-aicha'), (SELECT id FROM _aicha), 'text', 'Le résultat est superbe. Tu exposes tes photos quelque part ?', false, now() - interval '2 hours'),
  (md5('seed-m10'), md5('seed-convo-yamato'), (SELECT id FROM _yamato), 'text', 'Hey! Ton post sur les Matsuri m''a beaucoup parlé.', true,  now() - interval '3 days'),
  (md5('seed-m11'), md5('seed-convo-yamato'), (SELECT id FROM _me), 'text', 'Merci Yamato ! Un jour j''irai voir un Matsuri en vrai.', true,  now() - interval '3 days' + interval '1 hour'),
  (md5('seed-m12'), md5('seed-convo-yamato'), (SELECT id FROM _yamato), 'text', 'Je te ferai visiter, c''est promis 🎉', true,  now() - interval '1 day'),
  (md5('seed-m13'), md5('seed-convo-aicha'), (SELECT id FROM _me), 'text', 'Merci pour l''album de Sona Jobarteh, je l''écoute en boucle 🎶', true,  now() - interval '90 minutes'),
  (md5('seed-m14'), md5('seed-convo-aicha'), (SELECT id FROM _aicha), 'text', 'Contente que ça te plaise ! On tentera un morceau à quatre mains un jour 😄', true,  now() - interval '80 minutes')
ON CONFLICT DO NOTHING;

-- ── 6) Notifications for vivien ──────────────────────────────
INSERT INTO notifications (id, user_id, actor_id, type, action, target, is_unread, created_at)
VALUES
  (md5('seed-n1'), (SELECT id FROM _me), (SELECT id FROM _awa), 'comment', 'a commenté votre post "La nuit du Zangbeto à Ouidah"', md5('seed-post-1'), true, now() - interval '2 days'),
  (md5('seed-n2'), (SELECT id FROM _me), (SELECT id FROM _aicha), 'like', 'a aimé votre post "Ma sauce graine sans graine… mais avec âme 🍲"', md5('seed-post-2'), true, now() - interval '1 day'),
  (md5('seed-n3'), (SELECT id FROM _me), (SELECT id FROM _awa), 'match', 'votre culture est à 78% de synergie avec la sienne 🎉', NULL, true, now() - interval '5 hours'),
  (md5('seed-n4'), (SELECT id FROM _me), (SELECT id FROM _yamato), 'invite', 'vous invite à rejoindre la tribu "Anime & Mangas"', md5('seed-tribe-anime'), true, now() - interval '3 hours'),
  (md5('seed-n5'), (SELECT id FROM _me), (SELECT id FROM _aicha), 'message', 'vous a envoyé un message', md5('seed-convo-aicha'), false, now() - interval '2 hours')
ON CONFLICT DO NOTHING;

-- Vivien likes a few posts too (so the heart state is non-trivial)
INSERT INTO post_likes (post_id, user_id, created_at)
SELECT md5('seed-post-4'), (SELECT id FROM _me), now() - interval '3 hours'
UNION ALL SELECT md5('seed-post-6'), (SELECT id FROM _me), now() - interval '14 hours'
ON CONFLICT DO NOTHING;

-- ── 7) Love match avec Aïcha (synergie 37%) ─────────────────
-- Un seul côté : vivien a liké Aïcha → la popup match s'affiche avec 37%.
INSERT INTO love_matches (id, user_id, candidate_id, action, match_score, is_mutual, created_at)
VALUES (md5('seed-love-aicha'), (SELECT id FROM _me), (SELECT id FROM _aicha), 'like'::swipe_action, 37, false, now() - interval '2 hours')
ON CONFLICT DO NOTHING;

-- Rendez-vous bio/pays pour Aïcha (pour la popup match complète)
UPDATE users SET
  bio = 'Griotte & musicienne. La kora est ma voix, la mémoire de mes ancêtres mon carnet de chants. Dakar ↔ le monde.',
  profile_completed = true
WHERE id IN (SELECT id FROM _aicha);

-- ── 8) Follows : les auteurs seed apparaissent dans le feed par défaut ──
INSERT INTO follows (follower_id, following_id, created_at)
SELECT (SELECT id FROM _me), u.id, now() - interval '30 days'
FROM users u
WHERE u.id IN ((SELECT id FROM _aicha), (SELECT id FROM _awa), (SELECT id FROM _yamato), (SELECT id FROM _autre))
ON CONFLICT DO NOTHING;

-- Compteurs de profil cohérents avec les posts réellement publiés.
UPDATE users SET
  posts_count = (SELECT count(*) FROM posts p WHERE p.author_id = users.id),
  tribes_count = (SELECT count(*) FROM tribe_members tm WHERE tm.user_id = users.id)
WHERE id IN ((SELECT id FROM _me), (SELECT id FROM _aicha), (SELECT id FROM _awa),
             (SELECT id FROM _yamato), (SELECT id FROM _autre));
