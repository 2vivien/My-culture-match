# Audit — Architecture & Documentation

> **Date :** 27 novembre 2026  
> **Méthode :** lecture du code source, des manifestes, de la configuration et de l'arborescence ; croisement systématique des affirmations documentaires avec les fichiers réellement présents. Aucune exécution de services, aucun test de pénétration.  
> **Résultat :** la documentation contenait plusieurs couches superposées (prompts de génération, journaux de refactoring obsolètes, templates de stack). La couche canonique est désormais : [README.md](../README.md) → [ARCHITECTURE.md](ARCHITECTURE.md) → [backend/docs/README.md](../backend/docs/README.md) → spécifications métier.

---

## 1. Constat global

La documentation du dépôt (~10 000 lignes Markdown) s'était accumulée en quatre strates :

1. **Spécifications produit et algorithmes** (`docs/`, racine) — volumineuses, utiles, mais jamais indexées les unes par rapport aux autres ;
2. **Documentation technique backend** (`backend/docs/`) — la plus fiable, mais avec quelques affirmations datées ;
3. **Prompts et skills d'agent** (racine, `loop/`) — outils de génération, pas de la documentation de produit ;
4. **Résidus de templates et journaux de travail** (`myculturematch-web/README.md`, `resolve-issues.md`, fichiers `* (1)`) — sans valeur documentaire durable.

Le défaut principal n'était pas le manque d'information mais l'**absence de hiérarchie** : le README racine tenait en une ligne, et 60 documents n'étaient référencés par aucun index.

---

## 2. Faits vérifiés

| # | Constat | Preuve |
|---|---|---|
| F1 | README racine = un seul titre | `README.md:1` avant réécriture |
| F2 | README web = template Google AI Studio (clé `GEMINI_API_KEY`, lien AI Studio) | `myculturematch-web/README.md:1-20` avant réécriture |
| F3 | Le mobile n'a aucun appel réseau | recherche de `fetch(`, `axios`, `WebSocket`, `EXPO_PUBLIC`, `/api/` dans `mobile-app/` : 0 résultat |
| F4 | Auth mobile immédiate, sans token | `mobile-app/screens/AuthScreen.tsx:133-141` |
| F5 | Le backend n'utilise pas `better-auth` | `backend/package.json:27-49` (auth via `jose`, `otp.service.ts`, `session.service.ts`) |
| F6 | Script `seed` documenté mais absent | `backend/docs/README.md:57` vs `backend/package.json:10-26` |
| F7 | Références cassées vers `LANCEMENT-BOUCLE.md` (5 occurrences) alors que le fichier s'appelle `LANCEMENT-BOUCLE (1).md` | `loop/00-LISEZ-MOI.md`, `loop/program.md`, `loop/verificateur-02-securite.md` |
| F8 | `resolve-issues.md` pointe vers `file:///home/vivien/Workspace/...` et des composants disparus (`StepAvatar.tsx`, `StepsBasicInfo.tsx`) | `resolve-issues.md:11-39` |
| F9 | Les trois gros fichiers `PROMPT_*` / `MASTER PROMPT` sont des instructions de génération (« Pour Kimi », « À exécuter »), non référencées par aucun autre document | en-têtes des fichiers + recherche de mentions |
| F10 | 28 migrations Drizzle présentes, dont la mémoire relationnelle, le chat V2 et les messages temporels | `backend/drizzle/` |
| F11 | Le web n'utilise pas React Router mais un routeur par hash maison | `myculturematch-web/src/lib/router.ts:1-100` |
| F12 | Le toolchain mobile mélange Expo 54 et des presets 55/56 | `mobile-app/package.json:13,30,32` |
| F13 | Les corpus `RECOMMENDATION_*`, `love-algorithm/*`, `RELATIONSHIP_FUTURE_FEATURES` ne sont cités par aucun index et décrivent des cibles, pas des modules livrés | analyse des liens et mentions croisés |
| F14 | CI centrée sur `backend/**` ; web et mobile non couverts | `.github/workflows/ci.yml` (constat repris de l'audit 360) |
| F15 | `.claude/worktrees/` contient 9+ copies de tout le dépôt, non suivies par Git | répertoire non suivi ; laissé intact |

Corrections mineures au rapport d'exploration initial : `react-native-reanimated` est en **4.1.1** (et non 4.1.7) ; les fichiers `grafana/dashboards/mcm-backend.json` et `docker-compose.observability.yml` existent bien sous `backend/`.

---

## 3. Décisions de nettoyage

### Supprimés

| Fichier | Raison |
|---|---|
| `PROMPT_MASTER_BACKEND_MCM.md` (740 l.) | Prompt de génération « Pour Kimi », non référencé ; sa cible (`backend/docs/`) existe |
| `MICRO_PROMPTS_BACKEND_MCM.md` (1 037 l.) | Prompts d'exécution par module, non référencés ; redondants avec le code et les ADR |
| `MASTER PROMPT - ARCHITECTE BACKEND - STAFF ENGINEER.md` (1 546 l.) | Prompt de génération, non référencé |
| `resolve-issues.md` (253 l.) | Journal de refactoring avec chemins absolus morts et composants supprimés |

### Renommé

| Avant | Après | Raison |
|---|---|---|
| `loop/LANCEMENT-BOUCLE (1).md` | `loop/LANCEMENT-BOUCLE.md` | 5 documents attendent ce nom exact ; le suffixe `(1)` cassait les liens |

### Réécrits

| Fichier | Avant | Après |
|---|---|---|
| `README.md` | 1 ligne | Index canonique : démarrage, stack, architecture, documentation, limites |
| `myculturematch-web/README.md` | Template AI Studio | Setup réel du workspace web |

### Créés

- `docs/ARCHITECTURE.md` — architecture réelle et tableau des écarts documentaires.
- `docs/DOCUMENTATION_AUDIT.md` — ce rapport.

### Conservés avec statut

| Ensemble | Statut |
|---|---|
| `backend/docs/**` | Documentation technique de référence ; deux correctifs appliqués (auth, script `seed`) |
| `stack.md` | Référence d'infrastructure ; à lire avec les réserves de l'architecture (mobile, frontend) |
| `SKILL-audit-fonctionnel-ultra-complet.md` | Contrat fonctionnel utile ; référencé par `stack.md` et l'audit 360 |
| `SKILL_web.md`, `skill-refractory.md`, `loop/**` | Règles de travail d'agent — hors documentation d'architecture ; conservées |
| `SKILL_react_native.md` | **À mettre à jour** : décrit une cible non implémentée par le prototype |
| `docs/RELATIONSHIP_*`, `docs/RECOMMENDATION_*`, `docs/love-algorithm/**`, `docs/CHAT_V2.md`, `docs/TEMPORAL_MESSAGES.md` | Spécifications cibles ; conservées et indexées, avec avertissement explicite |
| `docs/AUDIT_360_PRE_PRODUCTION_2026-11-27.md`, `docs/MY_CULTURE_MATCH_AUDIT_ROADMAP.md` | Audits produit datés ; conservés comme registre de risques, non comme preuve d'implémentation |
| `.claude/worktrees/` | Non suivi par Git ; laissé intact (appartient à l'environnement de l'utilisateur) |

---

## 4. Qualité de la documentation restante

### Points forts

- Le backend dispose d'une documentation structurée : architecture, API, base de données, sécurité, algorithmes, scalabilité, ops, observabilité et 6 ADR.
- Les migrations et les modules correspondent globalement aux spécifications de mémoire relationnelle, chat V2 et messages temporels.
- Les prompts supprimés ont été remplacés par des référentiels lisibles et indexés.

### Points faibles persistants

1. **Mobile** : aucun README, aucun contrat mobile ↔ backend, aucune stratégie de build/release (`eas.json` absent), publication impossible en l'état.
2. **Web** : pas de tests unitaires ; la CI ne couvre pas le workspace.
3. **Spécifications orphelines** : plusieurs corpus (recommandation, love-algorithm) ne sont rattachés à aucune feuille de route opérationnelle.
4. **Processus `loop/`** : `program.md` contient encore des champs non remplis (`[à remplir]`, `[4]`, `[30]`).
5. **Obsolescence latitude** : références à des chemins locaux d'un autre poste dans d'anciens fichiers ; vérifier périodiquement avec une recherche `file:///`.

---

## 5. Actions restantes, par priorité

| Priorité | Action |
|---|---|
| P0 | Décider si le mobile entre dans le périmètre de première livraison ; sinon le retirer du `docker-compose.yml` et des discours produit, ou le marquer explicitement « démo » |
| P0 | Démontrer par des tests les contrôles d'accès (IDOR/BOLA), consentement Love/Friendship, blocage et suppression de compte (cf. audit 360) |
| P1 | Mettre à jour `SKILL_react_native.md` pour Expo 54 / New Architecture / `expo-image` / EAS, ou l'archiver comme document de cible |
| P1 | Ajouter une CI web (typecheck, build, Playwright) et étendre les filtres de `ci.yml` |
| P1 | Créer `mobile-app/README.md` et un contrat d'API mobile le jour où une couche réseau est introduite |
| P2 | Rattacher les corpus de recommandation et `love-algorithm/` à une feuille de route dated et à des critères d'implémentation |
| P2 | Renommer `myculturematch-web/package.json` (`name: react-example`) et déclarer la version du projet |
| P2 | Remplir `loop/program.md` ou archiver le dossier `loop/` s'il n'est plus utilisé |
| P3 | Vérifier périodiquement les liens internes et les chemins cités dans les documents (aucun script de vérification n'existe aujourd'hui) |

---

## 6. Périmètre et limites de cet audit

- L'audit porte sur la documentation et l'architecture **telle que décrite par le code**, pas sur le comportement à l'exécution.
- Aucun service n'a été démarré, aucun test n'a été joué, aucun déploiement n'a été inspecté.
- Les suppressions sont réversibles via Git (`git show HEAD:<chemin>`).
- Ce rapport ne remplace pas l'audit de sécurité produisant des preuves adversaires ; il le rend simplement lisible.
