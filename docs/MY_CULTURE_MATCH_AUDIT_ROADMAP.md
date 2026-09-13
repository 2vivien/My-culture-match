# My Culture Match — Audit produit, technique et roadmap

> Audit consolidé du projet `2vivien/My-culture-match`.
>
> Objectif : distinguer ce qui existe déjà, ce qui est partiellement couvert, ce qui doit être vérifié et tout ce qu'il faut terminer avant une bêta puis une production sérieuse.

## 1. Verdict

**Oui, My Culture Match est une bonne idée.** Son potentiel vient du fait que la culture peut devenir le moteur de la découverte, du matching et des conversations, plutôt qu'un simple filtre de profil.

### Évaluation

| Domaine | Note |
|---|---:|
| Idée produit | 8.5/10 |
| Différenciation | 9/10 |
| Architecture technique | 8.5/10 |
| Richesse fonctionnelle | 7/10 |
| Maturité produit | 6.5–7/10 |
| Prêt pour bêta publique | 5.5–6/10 |
| Potentiel long terme | 9/10 |

Le principal risque n'est pas le manque de fonctionnalités. C'est de devenir un mélange de Tinder + Instagram + Discord + TikTok + ChatGPT sans boucle produit claire.

**Boucle cible :**

`Découvrir une culture → découvrir des personnes → comprendre pourquoi elles sont pertinentes → se connecter → discuter → apprendre → revenir.`

---

# 2. Ce qui est déjà présent dans le projet

## Architecture

Le projet possède une base web + mobile + backend et une architecture API-first orientée scalabilité.

Technologies/éléments documentés ou visibles dans le projet :

- Hono
- PostgreSQL / Neon
- Drizzle ORM
- Redis
- MinIO
- Meilisearch
- BullMQ / workers
- WebSocket
- Better Auth
- Brevo
- i18next
- Sentry / observabilité
- Docker
- application web
- application mobile
- administration

## Authentification

Fonctionnalités visibles :

- authentification
- OTP
- codes à 6 chiffres
- expiration/rate limiting des OTP
- 2FA/TOTP
- formulaires web et mobile
- génération de secret TOTP

À renforcer : récupération de compte, gestion des sessions/appareils, révocation des sessions, journal de sécurité et détection d'activité suspecte.

## Onboarding

Étapes/components identifiés :

- identité
- nom/photo
- bio
- racines/origines
- occupation
- informations personnelles

L'onboarding est bien orienté pour alimenter le moteur culturel.

## Profil

Éléments présents :

- bio
- racines
- profession
- tags
- données personnelles
- progression/totem
- titres culturels comme Explorateur, Voyageur, Gardien, Sage, Ancêtre

## Culture Engine / Matching

Le projet prévoit un moteur culturel pour alimenter notamment :

- feed
- matching
- friendship
- love
- découverte

C'est le cœur stratégique du produit.

## Feed / contenu

Présence d'une logique de feed et de réflexion d'architecture sur :

- fanout
- push vs pull
- workers
- hashtags
- contenu social
- recommandations

## Explore / Search

Éléments visibles :

- Explore
- SearchBar
- recherche
- slugification des tags culturels
- Meilisearch dans l'architecture

## Chat

Une interface mobile de chat est présente avec une architecture temps réel/WebSocket prévue.

À finaliser : delivery states, read receipts, retry, offline queue, typing, presence, pièces jointes, modération et anti-spam.

## Lyra

Lyra est prévue comme assistant IA interculturel pour :

- démarrer une conversation
- aider à comprendre des différences culturelles
- réduire les malentendus
- aider à reformuler
- assister les échanges interculturels

Lyra doit rester spécialisée dans l'interculturel et ne pas devenir simplement un chatbot générique.

## Médias

MinIO est prévu pour le stockage objet et une couche d'URLs média existe.

À renforcer : compression, thumbnails, limites, formats, URLs signées, modération, nettoyage des médias orphelins et CDN.

## Workers / crons

Le backend possède des workers et des tâches planifiées. C'est une bonne base pour notifications, traitements lourds, indexation, emails et nettoyage.

À vérifier systématiquement : retry, idempotence, dead-letter, métriques, logs et gestion des jobs échoués.

## Internationalisation

i18next est prévu. L'interface peut être multilingue, mais l'interculturalité doit aussi devenir une fonctionnalité produit : langues parlées, apprises, préférées et objectifs linguistiques.

---

# 3. Ce qui manque ou doit être renforcé

## P0 — bloquant avant bêta publique

### 3.1 Trust & Safety

Indispensable pour une plateforme sociale/rencontre :

- report utilisateur
- report contenu
- report message
- block/unblock
- mute
- modération profils
- modération posts
- modération médias
- anti-spam
- anti-abus
- détection de faux comptes
- sanctions
- historique de modération
- queue admin
- appels/contestation
- audit sécurité

**Issue GitHub : #2**

### 3.2 Matching explicable

Ne pas afficher seulement `87% compatible`.

Chaque match doit expliquer les facteurs principaux :

- cultures communes
- langues
- intérêts
- objectifs relationnels
- valeurs ou préférences explicitement déclarées
- découverte complémentaire

Le moteur doit être déterministe pour les mêmes données, testé et documenté, avec des garde-fous contre les biais.

**Issue GitHub : #3**

### 3.3 Privacy / visibilité

L'utilisateur doit contrôler :

- profil public/privé
- présence dans Explore/search
- visibilité des racines
- visibilité des langues
- visibilité de la localisation
- qui peut envoyer un message
- qui peut envoyer une connexion
- présence/activité
- suppression du compte
- export des données
- consentements

Toutes les règles doivent être appliquées côté serveur et pas uniquement dans l'UI.

**Issue GitHub : #4**

### 3.4 Boucle MVP complète

Le parcours central doit être fluide :

`Signup → Onboarding → Profil → Découverte → Match → Pourquoi ce match ? → Connexion → Chat → Retour dans la découverte`

**Issue GitHub : #11**

### 3.5 Production readiness

Avant lancement :

- unit tests
- integration tests
- E2E web
- E2E mobile
- tests WebSocket
- tests matching
- tests permissions/privacy
- load tests
- CI lint/typecheck/test/build
- monitoring
- alerting
- health/readiness checks
- structured logs
- correlation IDs
- backups
- restore testé
- disaster recovery minimal
- migrations/rollback

**Issue GitHub : #10**

---

# 4. P1 — Version 1

## Groupes / communautés

Créer des espaces centrés sur une culture, une langue, une diaspora ou un intérêt.

Fonctions : création, rejoindre/quitter, public/privé, rôles, discussions, modération, notifications.

**Issue #5**

## Événements culturels

- festivals
- ateliers
- rencontres
- cuisine
- musique
- conférences
- rencontres de diaspora
- événements en ligne

Fonctions : création, inscription, participants, rappel, recherche et partage.

**Issue #6**

## Langues

Pour chaque langue :

- maternelle
- parlée
- niveau
- apprise
- souhaitée
- préférée pour discuter

Les langues doivent alimenter onboarding, profil, search, matching et chat.

**Issue #7**

## Culture Cards

Créer un système de découverte culturelle :

- traditions
- cuisine
- musique
- langues
- histoire
- patrimoine
- fêtes
- faits culturels

Les sujets sensibles doivent être contextualisés et sourcés.

**Issue #8**

## Notifications

- nouveau match
- nouvelle connexion
- message
- réponse
- interactions
- groupes
- événements
- sécurité
- push
- email transactionnel
- centre in-app
- read/unread
- préférences
- déduplication

**Issue #9**

## Reputation / trust signals

- email/téléphone vérifié
- badge de confiance
- qualité du profil
- ancienneté
- signaux anti-abus
- vérification photo optionnelle

Ne jamais récompenser le spam ou le volume artificiel.

**Issue #12**

## Analytics produit

Mesurer :

- signup
- onboarding
- profil complété
- culture découverte
- profil consulté
- match
- explication du match consultée
- connexion envoyée/acceptée
- premier message
- réponse
- conversation
- report/block
- D1/D7/D30

KPIs : activation, match rate, acceptance rate, first-message rate, conversation rate, profondeur des conversations, rétention et abuse rate.

**Issue #13**

## Cold start / lancement

Commencer avec une communauté concentrée plutôt que 100 pays vides.

Stratégie possible :

`Bénin + diaspora → Afrique francophone → Afrique de l'Ouest → diaspora internationale → expansion internationale`

Mesurer la liquidité du matching par culture, langue, ville et intention.

**Issue #17**

---

# 5. P2 — Après validation du cœur

## Traduction / assistance interculturelle

- traduction à la demande
- détection de langue
- original + traduction
- aide Lyra
- contexte culturel
- préférences de langue

Attention à la confidentialité des conversations privées.

**Issue #14**

## Audio / vidéo

- audio call
- video call
- WebRTC
- signaling
- presence
- permissions
- block/report pendant l'appel
- privacy

Ne pas prioriser avant texte + Trust & Safety + stabilité.

**Issue #15**

## Monétisation

Possibilités :

- Premium
- matching avancé
- filtres avancés
- IA/traduction premium
- événements premium
- abonnement

Ne pas dégrader fortement l'expérience gratuite.

**Issue #16**

---

# 6. Éléments supplémentaires à terminer

## Accessibilité

- navigation clavier web
- labels accessibles
- contrastes
- tailles de texte
- lecteurs d'écran
- états focus
- messages d'erreur accessibles
- touch targets mobile
- réduction des animations

## Legal / Data governance

Avant une vraie ouverture internationale, documenter :

- Terms of Service
- Privacy Policy
- consentements
- suppression de compte
- export des données
- conservation des données
- procédure de signalement
- règles de modération
- politique IA
- fournisseurs tiers et traitement des données

## Contenu initial

Un réseau culturel a besoin d'un minimum de contenu avant le lancement :

- profils de démonstration/seed selon les règles applicables
- Culture Cards
- cultures
- langues
- tags
- groupes
- événements

## Performance

Tester en particulier :

- feed
- search
- matching
- profile loading
- chat
- WebSocket
- upload média
- indexation

Objectifs : pagination, cache, lazy loading, images optimisées, requêtes DB indexées et jobs asynchrones.

## Observabilité

Chaque service critique doit avoir :

- logs structurés
- métriques
- traces lorsque pertinent
- erreurs centralisées
- alertes
- correlation/request ID
- dashboards

## Sécurité backend

À auditer :

- authz sur chaque endpoint
- ownership checks
- validation des entrées
- rate limiting
- protection brute force
- upload validation
- URLs signées
- secrets
- CORS
- headers
- CSRF selon architecture
- SQL/ORM safety
- WebSocket authorization
- abuse controls

---

# 7. Architecture cible

```text
Web / Next.js          Mobile / Expo
       │                    │
       └────── REST + WebSocket ──────┐
                                      │
                                  Hono API
                                      │
             ┌────────────────────────┼─────────────────────┐
             │                        │                     │
        PostgreSQL/Neon            Redis              Meilisearch
             │                        │                     │
             └──────────────┬─────────┴─────────────┬───────┘
                            │                       │
                         Workers                  MinIO
                         BullMQ                   Media
                            │
                            └──── Notifications / Emails
```

Cette architecture est cohérente avec un produit web/mobile scalable. Il faut surtout maintenant prouver la robustesse par des tests et de l'observabilité.

---

# 8. Ce qu'il ne faut pas faire

Ne pas chercher à construire immédiatement :

- TikTok
- Instagram
- Tinder
- Discord
- Zoom
- Meetup
- Wikipédia culturel
- ChatGPT généraliste

La priorité est la boucle :

**Découvrir → comprendre → rencontrer → connecter → échanger → apprendre.**

---

# 9. MVP final recommandé

### Identity

- signup/login
- OTP
- 2FA
- profil

### Culture

- racines
- cultures
- intérêts
- langues
- bio
- objectifs

### Culture Engine

- matching
- friendship
- cultural exchange
- dating optionnel
- score
- explication

### Discovery

- feed
- Explore
- search
- profils
- cultures

### Connection

- demande
- acceptation
- match
- chat

### Trust & Safety

- report
- block
- moderation
- anti-spam
- privacy

### Notifications

- messages
- matches
- connexions
- sécurité

### Analytics

- funnel
- activation
- rétention
- qualité des conversations

---

# 10. Roadmap

## Phase 1 — Security

`Privacy → Block/Report → Moderation → Anti-spam → Security audit`

## Phase 2 — Core

`Onboarding → Culture Profile → Culture Engine → Explainable Match → Connection → Chat`

## Phase 3 — Production

`Tests → CI → Monitoring → Load tests → Backup → Restore → Beta`

## Phase 4 — Network

`Groups → Events → Culture Cards → Languages → Notifications`

## Phase 5 — Growth

`Analytics → Cold Start → Community → Retention → Expansion`

## Phase 6 — Monetization / advanced communication

`Translation/AI → Audio/Video → Premium`

---

# 11. Critères de lancement

## Produit

- [ ] proposition de valeur immédiatement compréhensible
- [ ] onboarding terminé sans intervention
- [ ] profil culturel utile
- [ ] recommandations pertinentes
- [ ] pourquoi du match compréhensible
- [ ] conversation facile à démarrer

## Sécurité

- [ ] report
- [ ] block
- [ ] moderation
- [ ] anti-spam
- [ ] privacy
- [ ] suppression compte
- [ ] sessions
- [ ] audit logs

## Technique

- [ ] CI
- [ ] tests
- [ ] monitoring
- [ ] error tracking
- [ ] backups
- [ ] restore testé
- [ ] rate limits
- [ ] load testing
- [ ] WebSocket stable

## Business

- [ ] segment initial défini
- [ ] stratégie acquisition
- [ ] KPIs
- [ ] rétention
- [ ] coût infra
- [ ] coût IA

---

# 12. Les 5 priorités absolues

1. **Trust & Safety**
2. **Matching explicable**
3. **Privacy et contrôle de visibilité**
4. **Boucle MVP complète**
5. **Cold start et densité de communauté**

---

# 13. Conclusion produit

My Culture Match a une vraie proposition de valeur si la culture est le **moteur relationnel** du produit.

La plateforme doit permettre à quelqu'un de passer de :

> « Cette personne vient d'une culture différente. »

à :

> « Cette différence me donne une bonne raison de lui parler. »

Positionnement recommandé :

> **My Culture Match — Discover cultures. Meet people. Build meaningful connections.**

Version française :

> **My Culture Match — Découvre les cultures. Rencontre les personnes. Crée des connexions qui ont du sens.**

---

# 14. Issues GitHub déjà créées

| Issue | Priorité | Sujet |
|---:|:---:|---|
| #2 | P0 | Trust & Safety foundation |
| #3 | P0 | Explainable Culture Match engine |
| #4 | P0 | Privacy, visibility and discovery controls |
| #5 | P1 | Groups and cultural communities |
| #6 | P1 | Cultural events |
| #7 | P1 | Languages and intercultural communication profile |
| #8 | P1 | Culture Cards and educational discovery |
| #9 | P1 | Notifications and engagement system |
| #10 | P0 | Production readiness, testing and observability |
| #11 | P0 | Complete MVP product loop |
| #12 | P1 | Reputation and trust signals |
| #13 | P1 | Analytics and product funnel |
| #14 | P2 | Translation and intercultural assistance |
| #15 | P2 | Voice/video communication |
| #16 | P2 | Monetization and premium plan |
| #17 | P1 | Launch strategy and cold-start network |

---

# 15. Définition de « fini »

Le projet n'est pas « fini » quand toutes les pages existent.

Il est fini pour une bêta quand :

1. un nouvel utilisateur peut s'inscrire seul ;
2. il comprend le concept ;
3. il complète son identité culturelle ;
4. il trouve des personnes pertinentes ;
5. il comprend pourquoi un profil lui est recommandé ;
6. il peut se connecter ;
7. il peut discuter ;
8. il peut bloquer/signaler ;
9. ses données sont contrôlables ;
10. les erreurs critiques sont observées ;
11. les parcours critiques sont testés ;
12. une petite communauté réelle peut utiliser le produit sans intervention constante.

**Après cela seulement, il faut accélérer l'expansion, les groupes, les événements, l'IA avancée, la vidéo et la monétisation.**
