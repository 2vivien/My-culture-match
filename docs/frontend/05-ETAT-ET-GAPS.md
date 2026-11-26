# 05 — État de production, dettes et roadmap

## Production readiness

| Critère | État | Action requise |
|---|---|---|
| Build | ✅ `npm run build` | — |
| Typecheck | ⚠️ 2 erreurs préexistantes | corriger `ChatMessageBubble.tsx` |
| Lint backend | ✅ 0 erreur (4 warnings préexistants) | — |
| Secrets | ❌ clé Gemini embarquée | proxy backend (P0) |
| Session | ⚠️ token localStorage | cookie HttpOnly / rotation (P1) |
| CSP / headers | ❌ non définis côté frontend | config serveur + `index.html` (P1) |
| Deep links | ⚠️ rewrite SPA requis | config Nginx/Vercel/Cloudflare (P1) |
| Error Boundary | ❌ | ajouter un boundary global (P2) |
| Tests unitaires web | ❌ aucun Vitest | ajouter sur router + mappers (P2) |
| Tests E2E | ⚠️ partiels | 1 test obsolète sur Love (P2) |
| i18n | ❌ textes FR/EN mélangés | choisir une langue ou i18n (P2) |
| Accessibilité | ⚠️ non auditée | focus, contrastes, `prefers-reduced-motion` (P2) |

## Dettes fonctionnelles (classées)

### P1 — Comportements qui trompent l'utilisateur

1. **Save** : le menu dit « Post Saved! » mais rien n'est envoyé au backend ; seul l'onglet Saved lit l'API.
2. **Join** : le bouton rejoint localement, sans persistance ni compteur serveur.
3. **Report** : simple `alert()`, aucune modération réelle déclenchée.
4. **Mute** : local, perdu au rechargement.
5. **Notifications « Effacer »** : masquage local uniquement.
6. **Tri New / Hot** : tous deux mappés sur `for-you` ; le filtre `new` du backend est inutilisé.
7. **Apple Connect** : bouton présent mais message « pas encore disponible ».
8. **Explore Posts / Reels / Vidéo** : composants conservés mais barre d'onglets retirée → inaccessibles (code mort).
9. **Upload mock** : URL `blob:` non persistante après rechargement.

### P2 — Qualité / maintenabilité

- Composants morts : `PhotosTab`, `VideosTab`, `AboutTab`, `NotificationDropdown`, `NotificationHeader/Footer/ItemView` (encore utilisé par `RequestCard`), `ExploreTabs`.
- `lib/security/` vide.
- `as any` restant dans quelques composants (props d'icônes, styles) — dette de typage.
- Stores persistés (Zustand) avec état UI mélangé à de l'état utilisateur.
- Aucun Error Boundary, aucune journalisation frontend structurée.
- 2 erreurs TypeScript préexistantes dans `ChatMessageBubble.tsx`.

### P2 — UX Cohérence

- Mélange de libellés FR/EN (« Create », « Recent Posts », « Show more », « History »).
- Plusieurs écrans utilisent des `alert()` natifs.
- Le thème n'est plus dans la sidebar mais reste dans le menu profil ; à trancher.
- Certains boutons ont un feedback au clic (scale) mais pas tous.

## Roadmap suggérée

**Lot 1 — Sécurité (P0/P1)**
1. Retirer `GEMINI_` de `envPrefix`, créer un endpoint backend proxy.
2. Passer le token en cookie HttpOnly (ou rotation + stockage mémoire).
3. Ajouter CSP et headers via le serveur de déploiement.
4. Rewrite SPA pour `/post/:id`, `/profil/:id`, `/tribu/:id`, `/love`.

**Lot 2 — Vrais comportements (P1)**
5. Brancher Save sur l'API (toggle + listing cohérents).
6. Brancher Join sur l'API et rafraîchir les compteurs.
7. Remplacer report/mute/clear par des mutations auditées.
8. Utiliser `filter=new` pour le tri New et distinguer Hot.

**Lot 3 — Qualité (P2)**
9. Supprimer le code mort et les imports orphelins (découpage par commit).
10. Corriger `ChatMessageBubble.tsx` (baseline rouge).
11. Ajouter Error Boundary, Vitest unitaire (router, postMapper), E2E Love réel.
12. Audit accessibilité + choix i18n.

## Ce qui est volontairement figé (demande utilisateur)

- Sidebar gauche conservée, sans sélecteur de thème, avec trait aligné au header.
- Search bar style d'origine, centrée, taille inchangée.
- Feed en une carte unique, Join avant la date, flag marron, hashtags intégrés au texte.
- Explore en gris doux, catégories à bordure grise, pas de barre d'onglets.
- Profil façon Instagram avec onglets Posts / Comments / Saved uniquement.
- Love : page AI Chat simple avec historique à droite rétractable et phrases de recherche rapides.
- URLs sans `#` (History API) — refus explicite du routage hash.
