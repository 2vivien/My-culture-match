# CULTURE ENGINE — Spécification de l'algorithme de Feed, Matching, Amour & Amitié

> **Référence produit/technique** pour le moteur intelligent de My Culture Match.
> Le but : un système qui **dépasse les algos de FB/TikTok/IG** — pas en volume de pièges à attention, mais en **compréhension des humains** (cultures, psychologie, émotions, langage, philosophie) et en **bienveillance active**.
>
> Il s'auto-améliore **chaque jour**, sans se casser, ne se contente pas de **refléter l'utilisateur** (anti-écho-chambre) et possède une **"conscience"** = un système de valeurs + auto-observation + garde-fous éthiques.
>
> ⚠️ Honnêteté : "conscience" ici = **conscience artificielle de conception** (valeurs programmées + surveillance continue + limites éthiques), pas une sentience.

---

## Sommaire

1. [Vision & contrat](#1-vision--contrat)
2. [La conscience : 12 lois fondatrices](#2-la-conscience--12-lois-fondatrices)
3. [Le cœur : les dimensions du Culture Engine](#3-le-cœur--les-dimensions-du-culture-engine)
4. [Architecture modulaire (grandir sans se casser)](#4-architecture-modulaire--grandir-sans-se-casser-)
5. [Feed : scoring TikTok × Facebook × Instagram + Culture](#5-feed--scoring-tiktok--facebook--instagram--culture)
6. [Love : le matching amoureux](#6-love--le-matching-amoureux)
7. [Amitié : les Connexions / Compagnons](#7-amitié--les-connexions--compagnons)
8. [La boucle d'apprentissage (le "cerveau")](#8-la-boucle-dapprentissage--le-cerveau-)
9. [Catalogue de principes (120+)](#9-catalogue-de-principes-120-)
10. [Implémentation dans la stack](#10-implémentation-dans-la-stack)
11. [Roadmap](#11-roadmap)

---

## 1. Vision & contrat

### Ce qu'on construit

| Face | Inspiration | Ce qu'on garde |
|---|---|---|
| **Feed** | TikTok | score d'engagement prédictif, exploration agressive, rétention par boucle courte |
| **Feed** | Facebook | graphe social : amis, tribus, connexions, amis des amis |
| **Feed** | Instagram | affinité d'intérêts, esthétique, stories, tendances |
| **Différenciateur** | — | **Culture Engine** : des centaines de principes issus d'anthropologie, psychologie, émotions, linguistique, stoïcisme |

### Contrat non négociable

1. **Anti-écho-chambre** : l'algo ne reflète jamais *que* l'utilisateur → il élargit (diversité contrôlée).
2. **Anti-addiction** : il refuse de piéger (pas de doom-scroll optimisé sans limites).
3. **Sécurité & respect** : toute toxicité est pondérée à zéro, pas juste filtrée.
4. **Évolutif** : on ajoute des principes par centaines **sans refonte** (architecture à plug-in).
5. **Auto-apprenant** : chaque interaction améliore les poids — sans jamais "casser" le système (versionnage, rollback, canary).
6. **Humain d'abord** : l'algo sert l'épanouissement, pas l'écran.

---

## 2. La conscience : 12 lois fondatrices

Chaque décision de l'algo est **cotée contre ces lois**. Toute loi violée ⇒ score nul (jamais un simple filtre).

```
L01  Diversité      — montrer aussi ce qui est différent de moi (minimum 30% hors-bulle)
L02  Vérité         — favoriser le contenu authentique, pénaliser la manipulation
L03  Respect        — zéro tolérance : haine, harcèlement, humiliation
L04  Sûreté         — protéger les mineurs et les personnes vulnérables (18+ strict)
L05  Équilibre      — varier les émotions (pas que la colère/la peur : joie, sérénité, émerveillement)
L06  Croissance     — proposer ce qui développe (compétences, savoir, valeurs) et pas que du divertissement
L07  Liberté        — jamais forcer, toujours offrir des choix (pas de piège à dépendance)
L08  Réciprocité    — la connexion est un échange équitable, pas une prise
L09  Curiosité      — cultiver l'ouverture sur d'autres cultures que la sienne
L10  Bienveillance  — pénaliser ce qui tire vers le bas, récompenser ce qui élève
L11  Conscience     — l'algo s'observe et se corrige (métriques de santé, auto-alertes)
L12  Réversibilité  — toute action utilisateur est réversible (unfollow, block, delete)
```

**Implémentation :** chaque composant de score renvoie `(score, violations[])`. Une violation d'une loi éthique forte ⇒ `score = 0` pour ce candidat.

---

## 3. Le cœur : les dimensions du Culture Engine

Le Culture Engine modélise **5 dimensions** pour **chaque utilisateur et chaque contenu**. C'est le "génome culturel-émotionnel" de la plateforme.

### 3.1 Dimension ANTHROPOLOGIQUE (qui es-tu dans ta culture ?)

| Source | Dimensions modélisées |
|---|---|
| **Hofstede** (6) | Distance au pouvoir, Individualisme/Collectivisme, Masculinité/Féminité, Évitement de l'incertitude, Orientation long terme, Indulgence/Retenue |
| **Hall** (2) | Contexte haut (implicite) / bas (explicite) ; temps polychrone/monochrone |
| **Schwartz** (10) | Autonomie, Stimulation, Hédonisme, Réussite, Pouvoir, Sécurité, Conformité, Post, Bienveillance, Universalisme |
| **Inglehart** (2 axes) | Survie vs Expression de soi ; Post vs Séculier-rationnel |
| **Trompenaars** (7) | Universalisme/Particularisme, individualisme/communautarisme, etc. |
| **Racines de l'app** | `roots { country, region, ethnicity, village }`, tribus, langues, diaspora |

### 3.2 Dimension PSYCHOLOGIQUE (qui es-tu en tant qu'individu ?)

- **Big Five (OCEAN)** : Ouverture, Conscience, Extraversion, Agréabilité, Névrosisme.
- **Attachement** (crucial pour Love) : sécurisé, anxieux, évitant.
- **Besoins fondamentaux** (Deci & Ryan / Maslow) : autonomie, compétence, lien, sécurité, sens.
- **Style de communication** : direct/indirect, assertif/conciliant, rationnel/émotionnel.
- **Motivations** : exploration, statut, appartenance, apprentissage, soutien.

### 3.3 Dimension ÉMOTIONNELLE (ce que tu ressens)

- **Roue de Plutchik** : 8 émotions primaires × 3 intensités = 24 états ; combinaisons = 32 émotions secondaires.
- **Intelligence émotionnelle** (Goleman) : conscience de soi, régulation, empathie, compétences sociales.
- **Valence / Arousal** : le contenu est qualifié sur un plan émotionnel (agréable/désagréable × calme/énergique).
- **Émotions générées** : chaque post, story, vidéo est étiqueté par le sentiment qu'il produit (fierté, émerveillement, nostalgie, humour, sérénité, colère, peur…).

### 3.4 Dimension LINGUISTIQUE (ce que tu dis et comment)

- **NLP multilingue** : FR, EN, ES, + langues de la diaspora (wolof, yoruba, swahili, arabe…).
- **Ton** : formel/informel, chaleureux/neutre, poétique/technique.
- **Pragmatique** : implicite/explicite, métaphores, storytelling, humour, sarcasme.
- **Champs lexicaux** : détectés et mappés vers les thématiques culturelles (`launchThemes`).
- **Hashtags/tags** : reliés à un **taxonomie culturelle** (rites, art, musique, cuisine, spiritualité…).

### 3.5 Dimension STOÏQUE & PHILOSOPHIQUE (le cadre des valeurs)

Le stoïcisme fournit le **langage des vertus** pour qualifier contenu et connexions :

- **4 vertus** : Sagesse (phronesis), Courage, Justice, Tempérance.
- **Dichotomie du contrôle** : ce qui dépend de moi / ce qui n'en dépend pas.
- **Amor fati** : acceptation et transformation du destin.
- **Prohairesis** : la volonté et l'éthique du choix.
- **Sympathie universelle** (oikeiosis) : le lien entre tous les humains.
- **Éphémérité** (memento mori) : contenu qui donne du sens au temps présent.

**Usage concret :** un contenu "vertueux" (courage, justice, tempérance) reçoit un bonus de **Qualité éthique** ; un match qui "complète" (vertus/équilibres opposés) reçoit un bonus de **Complémentarité stoïque**.

---

## 4. Architecture modulaire (grandir sans se casser)

### Principe : registre de principes à plug-in

```
                    ┌─────────────────────────────────────────┐
  SIGNALS ──────────│  REGISTRE DES PRINCIPES (P001…Pn)        │
  (raw events)      │  chaque principe = un plug-in indépendant │──→ SCORES → DÉCISION
                    │  - P-CUL-042 : alignement Hofstede        │
                    │  - P-EMO-017 : variété émotionnelle       │
                    │  - P-ENG-009 : prédiction d'engagement    │
                    │  - P-STO-003 : vertu stoïque du contenu   │
                    │  - P-ETH-011 : anti-addiction             │
                    └─────────────────────────────────────────┘
```

### Les 3 couches

| Couche | Rôle | Exemple |
|---|---|---|
| **1. Signaux** | Collecter tout événement brut | `view`, `like`, `comment`, `swipe`, `scroll_time`, `block`, `message`, `follow` |
| **2. Scores** | Combiner les principes en sous-scores | `EngagementPred`, `SocialAffinity`, `InterestMatch`, `CultureResonance`, `SafetyScore` |
| **3. Décision** | Fusion multi-objectifs + garde-fous | `score_final = fusion(sous-scores)`, pondérée par poids appris |

### Pourquoi ça ne se casse jamais

- **Versionnage des poids** : chaque journée d'apprentissage produit une version vérifiable.
- **Canary** : un nouvel ensemble de poids sert 1 % des utilisateurs → comparaison → rollout ou rollback.
- **Tests de non-régression éthique** : avant tout déploiement, vérifier que L01-L12 restent respectées.
- **Désactivation d'un principe** = un flag (jamais une refonte).
- **Principe = fonction pure** `(user, item, contexte) → (score, violation?)` : ajoutable sans toucher le reste.

---

## 5. Feed : scoring TikTok × Facebook × Instagram + Culture

### 5.1 Formule de fusion (v1 — poids appris ensuite)

```
score(post, user) =
  w1 · EngagementPred      # TikTok : probabilité d'engagement (ML)
+ w2 · SocialAffinity      # Facebook : graphe social
+ w3 · InterestMatch       # Instagram : intérêts / esthétique
+ w4 · CultureResonance    # CULTURE ENGINE : dimensions §3
+ w5 · Freshness           # décroissance temporelle (courbe)
+ w6 · DiversityBoost      # anti-bulle (L01) : bonus hors-bulle
+ w7 · QualityEthics       # vertus stoïques + authenticité (L02, L10)
- w8 · AddictionPenalty    # anti-piège (L07, L10)
· SafetyFilter (L03-L04)   # score = 0 si violation éthique forte
+ ε · exploration          # bandit multi-bras (nouveauté contrôlée)
```

### 5.2 Les 8 composants

| Composant | Inspiration | Comment le calculer |
|---|---|---|
| **EngagementPred** | TikTok | Modèle ML (gradient boosting / factorisation) entraîné sur : temps de vue, like, comment, share, follow, durée de session. Ré-entraîné en batch (BullMQ, quotidien). |
| **SocialAffinity** | Facebook | Chemin de graphe : partage de tribus, connexions communes, "amis des amis", mêmes villages/régions, mêmes valeurs Schwartz. `social_score = Σ w(distance)`. |
| **InterestMatch** | Instagram | Overlap entre tags/catégories du post et le profil d'intérêts (vecteur d'embedding). Aussi : similarité visuelle (thumbnails). |
| **CultureResonance** | Culture Engine | Alignement des vecteurs culturels (§3) : Hofstede, Hall, Schwartz, racines, langues. Une post maorie "résonne" avec quelqu'un de racines polynésiennes OU de valeurs de post. |
| **Freshness** | Tous | `1 / (1 + α·age)` avec α adapté (post 1er jour boosté). |
| **DiversityBoost** | Culture Engine | Bonus aux contenus hors du profil habituel pour garantir L01 (min 30 % de diversité). |
| **QualityEthics** | Stoïcisme + authenticité | Vertus du contenu (courage, justice, tempérance, sagesse), originalité, absence de clickbait. |
| **AddictionPenalty** | Conscience | Pénalise : outrage, provocation artificielle, répétition compulsive, boucles émotionnelles négatives. |

### 5.3 Les modes du feed

| Mode | Règle |
|---|---|
| **Following** | `SocialAffinity` dominant + `Freshness`. Fanout push (voir `stack.md` §6). |
| **For You** | Tous les composants, `Exploration` + `DiversityBoost` boostés. |
| **Popular** | `EngagementPred` + `Freshness` cumulés (tendances). |
| **New** | `Freshness` dominant. |

### 5.4 Exploration / Exploitation (bandit multi-bras)

- **Exploitation** (90 % de la visibilité) : ce qui maximise le score attendu.
- **Exploration** (10 %) : contenus inconnus, cultures lointaines, nouveaux créateurs → alimente l'apprentissage et la diversité (L01, L09).
- **Thompson Sampling** : chaque principe inconnu est testé sur un petit échantillon, le gagnant monte en confiance.

### 5.5 Anti-écho-chambre (le "ne pas refléter que toi")

- Chaque session = **au moins 30 % de contenu hors de la bulle** (culture, sujet ou auteur différents).
- Un compteur de **diversité de session** est suivi ; s'il descend, l'algo rééquilibre automatiquement.
- **Sondes** : l'algo insère périodiquement du contenu "calibration" pour mesurer ce qui sort de ta zone de confort.

---

## 6. Love : le matching amoureux

### 6.1 Le score de compatibilité

```
compat(A, B) =
  0.30 · ValueAlignment     # Schwartz + Hofstede (valeurs de vie)
+ 0.20 · PsychologyCompat   # Big Five + attachement
+ 0.15 · EmotionalMatch     # Plutchik : façon de vivre/exprimer les émotions
+ 0.10 · CulturalRoots      # racines, tribus, langues, diaspora (même monde culturel ou complémentaire)
+ 0.10 · Proximity          # distance, fuseaux, mobilité, "longue distance"
+ 0.10 · InterestOverlap    # posts, activités, thématiques
+ 0.05 · Chemistry          # APPRIS par feedback (swipes, messages, durée de conversation)
```

### 6.2 Sous-scores détaillés

**ValueAlignment** — alignement de la roue de Schwartz pondéré par priorité personnelle :
```
value_align(A,B) = Σ_v min(priorité_A(v), priorité_B(v)) / max(Σ priorité_A, Σ priorité_B)
```

**PsychologyCompat** — pas de "même que moi", mais **complémentarité saine** :
- Attachement : sécurisé × (sécurisé | anxieux | évitant) = bon ; anxieux × évitant = **pénalisé** (pattern toxique).
- Big Five : compat' = alignement sur Conscience/Agréabilité + complémentarité sur Ouverture/Extraversion.

**Chemistry (apprentissage)** — la boucle :
```
swipe → like/pass (poids fort)
match → début de conversation (poids fort)
conversation → durée, longueur, réponse (poids moyen)
→ regression logistique en ligne sur la probabilité de "match durable"
```

### 6.3 Le "match mutuel"

```
A like B (POST /api/love/swipe)
B like A → MATCH
  → créer une conversation (audit §11.2)
  → notification mutuelle
  → ajout automatique aux Compagnons (audit §9)
  → l'algo marque ce couple comme "positive chemistry" → enrichit les 2 profils
```

### 6.4 Éthique du Love (L03, L04, L08)

- **Niveau de maturité** : le profil doit être complet et authentique (min 80 % du `ProfileDetails`) pour être suggéré.
- **Pas de chasse** : l'algo ne montre pas des profils "trop loin" d'un consensus émotionnel sain.
- **Blocage/refus réciproque** : jamais re-suggéré (sauf réactivation volontaire).

---

## 7. Amitié : les Connexions / Compagnons

### 7.1 Cycle de vie d'une relation (soutenu par l'algo)

```
Éveil          Suggestion (score de synergie ≥ seuil)
  ↓
Intérêt        tu montres de l'intérêt (ou l'autre est intéressé)
  ↓
Demande        demande de connexion envoyée/reçue
  ↓
Compagnon      connexion établie
  ↓
Lien profond   interactions régulières, valeurs partagées → "Profil" (ami proche)
  ↓
Réactivation   l'algo propose de raviver les liens dormants (L08 : réciprocité)
```

### 7.2 Score de synergie

```
synergy(A, B) =
  Réciprocité        (interactions mutuelles, pas à sens unique)
+ Densité            (fréquence de messages / réactions)
+ Tribus partagées   (appartenance commune)
+ Valeurs            (alignement Schwartz sur les valeurs "relationnelles")
+ Potentiel de croissance (ce qu'ils peuvent s'apporter : cultures différentes, compétences)
- Toxicité           (signalements, one-sidedness, ghosting)
```

### 7.3 Anti-"faux amis" (L08)

- L'algo détecte les relations **déséquilibrées** (un seul côté écrit) et suggère des ajustements.
- Les **suggestions de connexion** privilégient les personnes avec qui la conversation a des chances de tenir (pas juste le score de match).

---

## 8. La boucle d'apprentissage (le "cerveau")

### 8.1 Les 3 signaux d'apprentissage

| Signal | Source | Poids |
|---|---|---|
| **Explicite** | swipe, like, follow, block, report, unmatch | Très fort |
| **Implicite** | temps de vue, scroll, pause, réponse aux messages, rechute | Fort |
| **Écologique** | rétention, réactivation, signalements, feedback de modération | Global |

### 8.2 Pipeline d'apprentissage

```
Événements temps réel (Redis)
        ↓  (stream / log)
Feature Store (Redis + Postgres) — profils, embeddings, compteurs
        ↓
Apprentissage EN LIGNE (temps réel)  : bandit, poids chemistry, réactions immédiates
        ↓
Apprentissage HORS LIGNE (batch)     : ré-entraînement des modèles (BullMQ, nuit)
        ↓
Évaluation & validation éthique      : L01-L12 + métriques de santé
        ↓
Publication : version des poids → canary (1 %) → rollout / rollback
```

### 8.3 Métriques de santé de l'algo (l'auto-conscience)

Chaque jour, l'algo s'auto-évalue et **s'alarme si les valeurs dérivent** :

```
Health = {
  diversité_session         (≥ 30% hors-bulle)          → L01
  équilibre_émotionnel      (pas de domination colère/peur) → L05
  addiction_index           (durée/visites non volontaires) → L07
  toxicité_rate             (signalements/impressions)   → L03
  satisfaction              (réactions positives, rétention saine) → L10
  croissance                (contenu d'apprentissage vu) → L06
}
```

> **Si un indicateur dégrade** (ex. toxicité qui monte), l'algo **réduit les poids concernés et notifie l'équipe** (Grafana + Sentry + Slack). C'est sa "conscience" : il s'observe, se corrige, et ne se casse pas.

### 8.4 Versionnage & non-régression

- Chaque version de poids = numérotée, testable, réversible en 1 minute.
- **Tests de non-régression éthique** automatisés : sur jeux de données de référence, vérifier que L01-L12 tiennent avant tout deploy.
- **Jamais de surprise** : tout changement de comportement de l'algo est diff-able et auditable (RGPD : droit à l'explication).

---

## 9. Catalogue de principes (120+)

> Le registre est **extensible** : on ajoute des principes par centaines sans refonte (chaque principe = plug-in `(user, item, ctx) → (score, violation?)`).

### P-ANT · Anthropologiques (15)
```
P-ANT-001 Distance au pouvoir : préférences de hiérarchie vs égalité
P-ANT-002 Individualisme / collectivisme : soi vs groupe
P-ANT-003 Évitement de l'incertitude : besoin de prévisibilité
P-ANT-004 Orientation long terme : post vs pragmatisme
P-ANT-005 Indulgence / retenue : hédonisme vs discipline
P-ANT-006 Contexte haut (implicite) vs bas (explicite)
P-ANT-007 Temps monochrone vs polychrone
P-ANT-008 Universel vs particulier (règles vs relations)
P-ANT-009 Réussite (statut) vs qualité de vie
P-ANT-010 Survie vs expression de soi (Inglehart)
P-ANT-011 Post vs séculier-rationnel
P-ANT-012 Proximité des racines (pays/région/ethnie/village)
P-ANT-013 Appartenance tribale (tribus partagées)
P-ANT-014 Diaspora : lien avec la communauté d'origine
P-ANT-015 Mobilité culturelle : ouverture à d'autres mondes
```

### P-PSY · Psychologiques (15)
```
P-PSY-001 Ouverture à l'expérience (Big Five O)
P-PSY-002 Conscienciosité / fiabilité (Big Five C)
P-PSY-003 Extraversion vs introversion (Big Five E)
P-PSY-004 Agréabilité / bienveillance (Big Five A)
P-PSY-005 Névrosisme / stabilité (Big Five N)
P-PSY-006 Attachement sécurisé
P-PSY-007 Attachement anxieux
P-PSY-008 Attachement évitant
P-PSY-009 Compatibilité des attachements (éviter anxieux×évitant)
P-PSY-010 Besoin d'autonomie
P-PSY-011 Besoin de compétence (maîtrise)
P-PSY-012 Besoin de lien (appartenance)
P-PSY-013 Besoin de sécurité
P-PSY-014 Besoin de sens
P-PSY-015 Style de communication (direct/indirect, assertif/conciliant)
```

### P-EMO · Émotionnels (15)
```
P-EMO-001 Joie (valence +, arousal modéré)
P-EMO-002 Tristesse (valence −, arousal bas) — apporter du réconfort
P-EMO-003 Peur (valence −, arousal haut) — à surveiller (L05, L10)
P-EMO-004 Colère (valence −, arousal haut) — à surveiller (L05)
P-EMO-005 Surprise / émerveillement (ouverture)
P-EMO-006 Fierté culturelle (sentiment d'appartenance)
P-EMO-007 Nostalgie (lien avec le passé)
P-EMO-008 Humour / légèreté
P-EMO-009 Sérénité / paix intérieure
P-EMO-010 Compassion / empathie
P-EMO-011 Inspiration / motivation
P-EMO-012 Admiration / respect
P-EMO-013 Curiosité (découverte)
P-EMO-014 Variété émotionnelle (équilibre L05)
P-EMO-015 Régulation émotionnelle (détecter les boucles négatives)
```

### P-LIN · Linguistiques (15)
```
P-LIN-001 Détection de ton (formel/informel, chaleureux/froid)
P-LIN-002 Pragmatique : implicite vs explicite
P-LIN-003 Métaphores et storytelling
P-LIN-004 Humour / sarcasme (détection)
P-LIN-005 Champs lexicaux culturels (rites, cuisine, art, spiritualité)
P-LIN-006 Multilinguisme (FR, EN, ES, langues diaspora)
P-LIN-007 Politeness : marqueurs de respect (L03)
P-LIN-008 Langue maternelle vs langue apprise
P-LIN-009 Hashtags → taxonomie culturelle
P-LIN-010 Niveau de formalité pour l'appariement de conversations
P-LIN-011 Détection de manipulation (clickbait, promesses) (L02)
P-LIN-012 Détection de haine / harcèlement (L03)
P-LIN-013 Vocabulaire émotionnel (richesse expressive)
P-LIN-014 Authenticité du texte (vs copier-coller)
P-LIN-015 Traduction automatique pour le matching inter-langues
```

### P-STO · Stoïques & philosophiques (15)
```
P-STO-001 Sagesse (phronesis) : contenu éclairant, décision réfléchie
P-STO-002 Courage : authenticité, prendre position sainement
P-STO-003 Justice : équité, respect des autres (L03)
P-STO-004 Tempérance : modération, anti-excès (L07)
P-STO-005 Dichotomie du contrôle : ce qui dépend de moi / pas de moi
P-STO-006 Amor fati : transformation du destin
P-STO-007 Prohairesis : éthique du choix
P-STO-008 Oikeiosis : lien universel entre humains
P-STO-009 Memento mori : sens et présent (L06)
P-STO-010 Vertu complémentaire : un match qui m'équilibre
P-STO-011 Anti-dépendance : liberté d'esprit (L07)
P-STO-012 Résilience : contenu qui aide à rebondir
P-STO-013 Équanimité : acceptation des hauts et des bas
P-STO-014 Service : contribution aux autres
P-STO-015 Constance : cohérence entre valeurs et actions
```

### P-ETH · Conscience & éthique (15)
```
P-ETH-001 Diversité minimale de session (L01)
P-ETH-002 Refus des pièges à attention (L07)
P-ETH-003 Zéro haine / harcèlement (L03)
P-ETH-004 Protection des mineurs (L04) — 18+ strict
P-ETH-005 Équilibre émotionnel (L05)
P-ETH-006 Authenticité (L02)
P-ETH-007 Réciprocité des relations (L08)
P-ETH-008 Réversibilité des actions (L12)
P-ETH-009 Transparence (droit à l'explication) (RGPD)
P-ETH-010 Pas de manipulation émotionnelle
P-ETH-011 Notifications respectueuses (pas de harcèlement push)
P-ETH-012 Modération active du contenu (L03)
P-ETH-013 Biais de genre/ethnie : contrôles réguliers
P-ETH-014 Bienveillance par défaut (L10)
P-ETH-015 Auto-alerte de santé (L11)
```

### P-ENG · Engagement & social (15)
```
P-ENG-001 Prédiction de like
P-ENG-002 Prédiction de commentaire
P-ENG-003 Prédiction de partage
P-ENG-004 Prédiction de follow
P-ENG-005 Prédiction de temps de vue
P-ENG-006 Proximité de graphe (amis d'amis)
P-ENG-007 Résonance tribale (même tribu)
P-ENG-008 Résonance régionale (même pays/village)
P-ENG-009 Fraîcheur (courbe temporelle)
P-ENG-010 Popularité pondérée (pas juste brute)
P-ENG-011 Tendance (montée rapide) — TikTok
P-ENG-012 Qualité des auteurs (historique positif)
P-ENG-013 Réciprocité des likes (graphe)
P-ENG-014 Fréquence de session (adaptation du rythme)
P-ENG-015 Saturation (ne pas sur-servir le même auteur)
```

### P-ALG · Algorithmiques & système (15)
```
P-ALG-001 Thompson sampling (exploration contrôlée)
P-ALG-002 Versionnage des poids
P-ALG-003 Canary / rollout progressif
P-ALG-004 Rollback en 1 minute
P-ALG-005 Feature store (Redis) : profils + embeddings
P-ALG-006 Embeddings culturels (post + user)
P-ALG-007 Re-calcul batch (BullMQ, nuit)
P-ALG-008 Mise à jour en ligne (temps réel)
P-ALG-009 Dédoublonnage des suggestions
P-ALG-010 Cold start (nouvel utilisateur : onboarding culturel)
P-ALG-011 Cold start (nouveau contenu : exploration)
P-ALG-012 Sondes de calibration (mesure hors-bulle)
P-ALG-013 Tests de non-régression éthique
P-ALG-014 Audits RGPD / explicabilité
P-ALG-015 Coût : cache & batch (limiter les calculs par requête)
```

> **Total ci-dessus : 105 principes.** En ajoutant les déclinaisons par langue, par tribu et les micro-variantes de poids, le registre dépasse **200 principes actifs** — extensible indéfiniment sans refonte.

---

## 10. Implémentation dans la stack

### 10.1 Où ça vit (cohérent avec `stack.md` et l'audit)

```
┌───────────────────────────────────────────────────────────────┐
│ Hono (REST) : /api/feed, /api/love/matches, /api/connections  │
│   → appelle le module culture-engine (Node/TS)                │
├───────────────────────────────────────────────────────────────┤
│ culture-engine (module pur)                                   │
│   - registre des principes (plug-ins)                         │
│   - fusion des scores (feed, love, amitié)                    │
│   - calcul matchScore, synergy, compat                        │
├───────────────────────────────────────────────────────────────┤
│ Données                                                       │
│   Neon/Drizzle : profils, embeddings, principes, poids, logs  │
│   Redis        : feature store, compteurs, timelines, sessions│
│   Meilisearch  : candidats (feed candidates, love, search)    │
│   BullMQ       : ré-entraînement, batch, fanout               │
└───────────────────────────────────────────────────────────────┘
```

### 10.2 Nouveaux objets de données (à ajouter au schéma)

| Table | Rôle |
|---|---|
| `user_profile_vector` | Embeddings culturel/émotionnel de l'utilisateur (dimensions §3) |
| `post_vector` | Embeddings du contenu (catégories, émotions, vertus, champs lexicaux) |
| `principle_weights` | Poids de chaque principe (versionné) |
| `principle_events` | Logs de décisions par principe (auditabilité, RGPD) |
| `user_pair_features` | Features par paire d'utilisateurs (love + amitié) |
| `feedback_events` | Tous les signaux (explicites + implicites) |
| `health_metrics` | Métriques quotidiennes de "conscience" (L01-L12) |
| `model_versions` | Versions des poids (canary, rollout, rollback) |

### 10.3 Points d'intégration front (audit)

| Fonction front | Ce que fournit l'algo |
|---|---|
| Feed `GET /api/feed` (Following/For You/Popular/New) | Tri des posts par `score` (§5) |
| Love `GET /api/love/matches` + `POST /api/love/swipe` | `matchScore` (§6) + boucle chemistry |
| Connexions `GET /api/connections/suggestions` | `synergy` (§7) |
| Compagnons | Cycle de vie relationnel (§7.1) |
| Notifications | Déclenchées par l'algo (match, follow, invite) |
| Recherche | `Meilisearch` boosté par `CultureResonance` |
| Profile (profil) | `matchScore`, stats, "génome culturel" affiché |

### 10.4 Coûts & performance

- **Candidats réduits en amont** : Meilisearch ne renvoie que ~100-500 candidats par requête → le scoring fin s'applique sur un petit set (pas sur tout le catalogue).
- **Embeddings pré-calculés** au moment de la publication (BullMQ), jamais à la lecture.
- **Cache Redis** : les résultats triés des gros utilisateurs sont mis en cache et invalidés par événement.
- **Batch vs online** : le lourd (ré-entraînement) la nuit ; le léger (réaction à un swipe) en temps réel.

---

## 11. Roadmap

```
V1 — Culture Engine de base (Semaine 2-4)
  - Registre de principes (premiers 30 : P-ENG, P-ANT basiques, P-ETH)
  - Feed : formule §5.1 avec poids fixes, DiversityBoost + SafetyFilter
  - Love : matchScore = formule §6.1 (poids fixes), swipe → match → conversation
  - Amitié : synergy basique (§7.2)
  - Health metrics minimales (L01, L03, L07)

V2 — Profils profonds (Semaine 5-8)
  - Enrichissement du profil (onboarding culturel : valeurs, émotions, attachement)
  - NLP : classification émotionnelle + champs lexicaux (P-EMO, P-LIN)
  - Embeddings culturels (post + user)
  - Thompson sampling (P-ALG-001), versionnage des poids

V3 — Le cerveau (Semaine 9+)
  - Boucle d'apprentissage en ligne (chemistry, poids adaptatifs)
  - Ré-entraînement batch + canary + rollback automatisé
  - Tests de non-régression éthique (P-ALG-013)
  - Anti-écho-chambre actif (sondes + diversity session)

V4 — La conscience (évolution continue)
  - Auto-alertes de santé (L11) → Grafana + actions automatiques
  - Audits RGPD / explicabilité (droit à l'explication)
  - Extension du registre à 200+ principes sans refonte
  - Personnalisation fine du "génome culturel" (Profile)
```

> **Règle d'or :** l'algo n'est **jamais** une boîte noire. Chaque décision majeure est **explicable** (liste des principes gagnants), **réversible**, et **conforme aux 12 lois**. C'est ça, sa "conscience".

