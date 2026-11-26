# 06 — Tests et vérification

## Commandes utiles

Depuis la racine du dépôt :

```bash
# Frontend
cd myculturematch-web
npm run lint          # tsc --noEmit
npm run build         # vite build
npm run test:e2e      # playwright test
npm run dev           # http://localhost:5173 (proxy /api -> :3000)

# Backend / seeds
npm --prefix backend run migrate
docker exec -i mcm_postgres psql -U mcm -d mcm < backend/scripts/seed-mocks.sql
npm --prefix backend run seed:feed
```

Le script `backend/scripts/verify-feed.ts` utilisé pendant l'audit était temporaire et supprimé après vérification.

## État des vérifications (au commit courant)

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` (web) | 2 erreurs **préexistantes** dans `src/components/chat/ChatMessageBubble.tsx` (lignes 13 et 27) |
| Diff des erreurs vs `baseline/post-profil` | 0 nouvelle erreur |
| `npm run build` | ✅ build OK (~2,6 Mo JS, warning de taille de chunk uniquement) |
| `npx eslint src --ext .ts` (backend) | 0 erreur, 4 warnings préexistants |
| `npm run migrate` | ✅ migrations `0020_posts_count` + `0021_posts_vocabulary` appliquées |
| Seed SQL | ✅ users existants réutilisés, 8 posts insérés, dates rafraîchies |
| `npm run seed:feed` | ✅ 4 posts poussés dans `feed:following:<me>` (hors posts de l'utilisateur courant) |
| API `/api/feed?filter=for-you` (test.flow) | ✅ 200, `total = 8` |
| API feed following (vivien) | ✅ 200, 4 posts d'autres auteurs |

## Scénarios Playwright exécutés pendant l'audit

Tous avec `loginByOtp(page, 'test.flow@example.com', true)` :

1. **Feed** : affichage des onglets de tri, carte unique, Join avant la date, date courte, textes sélectionnables.
2. **Création de post** : ouverture via le bouton header, titre + corps, `Publish Post` → retour Home.
3. **Navigation Profil** : onglets Posts / Comments / Saved, profil façon Instagram.
4. **Menu profil** : en-tête `@username` + « Celebrity Profile », avatar avec anneau rose.
5. **Notifications** : ouverture de la page dédiée via la cloche (plus de popup).
6. **Explore** : catégories en gris, cartes de tribus, bouton Join gris en haut à droite.
7. **Love** : welcome, phrases rapides, envoi d'un message, historique à droite, masquage/réaffichage.
8. **URL propres** : `/`, `/love`, `/post/<id>` — aucune occurrence de `#`.

Un test préexistant (`navigation : Love, Explore, Connexion, Profile`) échoue sur la baseline car il attend le titre « Love Matchmaker », remplacé par l'UI actuelle « Matchmaking conversationnel » → **non lié aux changements de cette branche**.

## Comment reproduire un audit équivalent

1. Créer une baseline : `git tag baseline/<sujet>` puis comparer `git diff baseline/<sujet>`.
2. Lancer `tsc --noEmit` avant et après, trier les sorties, `comm -23` pour isoler les nouvelles erreurs.
3. Lancer `npm run build`.
4. Démarrer le backend + Redis + Postgres (docker-compose) et appliquer les migrations/seeds.
5. Démarrer `npm run dev` puis exécuter les scénarios Playwright ciblés (pas de suite complète aveugle).
6. Vérifier l'API avec un token de session valide (`createSession` côté backend) plutôt que de supposer le frontend.

## Limites connues de la couverture

- Aucun test unitaire frontend (`vitest` non configuré dans `myculturematch-web`).
- Pas de test visuel par snapshot ; les captures d'écran de l'audit sont dans `/tmp/opencode/` (hors dépôt).
- Pas de test de sécurité automatisé (CSP, XSS, rotation de token) : voir `03-AUTH-SECURITE.md`.
