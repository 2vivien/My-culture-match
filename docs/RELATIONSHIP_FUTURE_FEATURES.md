# Relationship Future Features — Vision & Roadmap

Ce document regroupe les fonctionnalités futures prévues autour de la relation à deux dans **My Culture Match**. Il sert de référence produit et technique avant implémentation.

L'objectif n'est pas de transformer l'application en une collection de mini-features sociales. Le cœur reste la conversation, la culture, la confiance et la construction d'une histoire commune.

---

## 1. Philosophie produit

Les fonctionnalités futures doivent aider deux personnes à **construire et raconter leur histoire**, sans que l'algorithme décide à leur place ce que leur relation signifie.

Principes :

- la relation reste centrée sur le chat ;
- Love et Friendship restent deux expériences distinctes ;
- les souvenirs manuels appartiennent aux deux participants lorsqu'ils sont enregistrés dans l'espace partagé ;
- les analyses algorithmiques sont des signaux, jamais des jugements ;
- l'IA sert principalement à comprendre, organiser, proposer et raconter, pas à inventer ;
- aucun modèle ne doit déduire comme un fait qu'une personne aime, néglige, trompe ou manipule l'autre ;
- les données sensibles doivent respecter les paramètres de consentement et de confidentialité ;
- toute narration générée par IA doit rester traçable à des éléments réels disponibles dans la conversation ou la boîte à souvenirs.

---

# 2. Fonctionnalités futures

## 2.1 Capsule temporelle

Une capsule permet de regrouper plusieurs éléments et de les verrouiller jusqu'à une date future.

Une capsule peut contenir :

- messages ;
- photos ;
- vidéos ;
- audio ;
- lieu ;
- date ;
- note ;
- événement ;
- souvenir de la Boîte à souvenirs.

Exemples :

- « À ouvrir dans 6 mois » ;
- « Notre capsule de cette année » ;
- « À ouvrir le jour de notre anniversaire ».

La capsule doit réutiliser le système de messages temporels et la Boîte à souvenirs lorsque cela est pertinent.

---

## 2.2 Notre première fois

Une expérience automatique qui identifie des premières étapes significatives de la relation à partir des données réellement disponibles.

Exemples possibles :

- premier message ;
- première photo partagée ;
- premier média ;
- première rencontre enregistrée ;
- premier souvenir ;
- première sortie enregistrée ;
- premier événement commun ;
- première capsule ;
- première année ensemble.

Le système doit afficher une preuve ou une source lorsque cela est possible. Il ne doit jamais présenter une inférence comme un fait.

---

## 2.3 Journal partagé

Un véritable journal à deux, intégré à la conversation.

Chaque participant peut écrire librement :

- ce qu'il a fait aujourd'hui ;
- ce qu'il souhaite retenir ;
- un événement ;
- une pensée ;
- une photo ;
- une vidéo ;
- un audio ;
- un lieu ;
- une date importante.

Les deux personnes peuvent avoir des entrées différentes pour une même journée. Le système conserve l'auteur de chaque entrée.

Le journal doit pouvoir alimenter la Boîte à souvenirs et la timeline, sans les remplacer.

---

## 2.4 Questions à deux — expérience IA

Cette fonctionnalité sera construite avec une **intégration IA**.

Le principe : l'IA propose ou anime des questions destinées aux deux participants.

Exemples :

- « Quel est ton meilleur souvenir de nous ? »
- « Qu'est-ce que tu aimerais qu'on fasse ensemble cette année ? »
- « Quelle valeur est la plus importante pour toi dans notre relation ? »
- « Quel moment aimerais-tu revivre ? »
- « Qu'est-ce que tu penses que l'autre apprécie le plus chez toi ? »

### Fonctionnement envisagé

```text
Conversation / contexte autorisé
          ↓
      moteur IA
          ↓
question adaptée au contexte
          ↓
   participant A répond
   participant B répond
          ↓
 réponses verrouillées
          ↓
       révélation
          ↓
 comparaison ludique / synthèse
          ↓
 souvenir optionnel
```

### Règles IA

L'IA ne doit pas :

- diagnostiquer la relation ;
- déclarer qu'une personne aime ou n'aime pas l'autre ;
- attribuer une faute ;
- inventer une émotion ;
- exposer une réponse privée avant la révélation ;
- utiliser des données auxquelles le participant n'a pas consenti.

L'IA peut :

- choisir une question adaptée ;
- varier la difficulté et le ton ;
- éviter les questions déjà utilisées ;
- détecter des thèmes déjà abordés ;
- générer une courte synthèse après révélation ;
- proposer de transformer le résultat en souvenir partagé.

La réponse de chaque participant doit rester inaccessible à l'autre jusqu'à la phase de révélation prévue par le produit.

---

## 2.5 Devine ma réponse

Une extension ludique des Questions à deux.

Chaque personne répond d'abord à une question, puis tente de deviner la réponse de l'autre.

```text
Question
   ↓
A répond
B répond
   ↓
A devine B
B devine A
   ↓
Révélation
   ↓
Résultat ludique
```

Le score doit être présenté comme un jeu, jamais comme un indicateur psychologique ou une mesure de compatibilité scientifique.

---

## 2.6 Timeline émotionnelle

Une représentation de l'évolution de l'activité et des thèmes de la relation au fil du temps.

Elle peut utiliser :

- densité des conversations ;
- périodes d'activité ;
- thèmes dominants ;
- souvenirs enregistrés ;
- événements ;
- messages temporels révélés.

Important : cette timeline ne doit pas afficher de jugement du type « période toxique », « personne distante » ou « il/elle ne faisait plus d'effort ».

Les formulations doivent rester descriptives :

- « période très active » ;
- « nouvelle phase de conversation » ;
- « plusieurs souvenirs ajoutés » ;
- « activité plus faible sur cette période ».

---

## 2.7 Notre histoire

Une expérience de rétrospective automatique aux périodes :

- 1 mois ;
- 3 mois ;
- 6 mois ;
- 1 an.

Elle réutilise Relationship Intelligence V2, la Boîte à souvenirs et les événements réellement disponibles.

Le système peut produire :

- moments importants ;
- premières étapes ;
- thèmes récurrents ;
- souvenirs manuels ;
- évolution de l'activité ;
- moments particulièrement positifs ou difficiles, avec formulation neutre ;
- résumé de la période.

L'IA peut ensuite transformer ces éléments en narration naturelle, uniquement à partir des preuves sélectionnées par le moteur déterministe.

---

## 2.8 Vlog de relation

Une vue multimédia de l'histoire commune.

Elle rassemble :

- photos ;
- vidéos ;
- audios ;
- souvenirs ;
- événements ;
- lieux ;
- dates.

À terme, le système peut générer une capsule vidéo ou un montage chronologique à partir des médias autorisés.

Aucune génération automatique ne doit publier ou partager un média sans action explicite de l'utilisateur.

---

## 2.9 « Ce que je voulais te dire »

Une catégorie spéciale de message temporel destinée aux messages émotionnels ou aux choses que l'on souhaite transmettre plus tard.

Exemples :

- une pensée ;
- une promesse ;
- un message pour un anniversaire ;
- une lettre pour dans 6 mois ;
- une phrase que l'on souhaite relire ensemble plus tard.

Elle utilise l'infrastructure des messages temporels existants et ne crée pas un second système de livraison différée.

---

## 2.10 Promesses temporelles

Une extension des messages temporels permettant de créer une promesse avec une date de vérification.

Exemple :

> « Dans 6 mois, on reviendra voir cette promesse. »

Une promesse peut contenir :

- texte ;
- date cible ;
- participants ;
- rappel ;
- statut ;
- souvenir associé.

Le système ne doit pas juger si la promesse a été respectée. Il fournit seulement un espace de rappel et de discussion.

---

## 2.11 Retour au même endroit

Permettre de sauvegarder un lieu associé à une histoire et de programmer un rappel pour y retourner.

Exemple :

> « Revenir ici dans un an. »

Le lieu peut être lié à :

- un souvenir ;
- une photo ;
- un événement ;
- une capsule ;
- une date.

---

## 2.12 Souvenir privé → souvenir partagé

Un participant peut créer un souvenir personnel puis décider plus tard de le partager avec l'autre.

États possibles :

```text
privé
  ↓
prêt à partager
  ↓
partagé
  ↓
intégré à l'histoire commune
```

Le partage nécessite une action explicite.

---

## 2.13 Comment on s'est rencontrés

Une timeline spéciale consacrée au début de l'histoire.

Elle peut contenir :

- première interaction ;
- contexte de rencontre ;
- première conversation ;
- premier souvenir enregistré ;
- premières étapes importantes.

Les informations manquantes peuvent être renseignées manuellement. Le système ne doit pas inventer le contexte de rencontre.

---

## 2.14 Souvenirs croisés

Les deux participants racontent séparément le même événement.

```text
Événement
   ↓
A raconte sa version
B raconte sa version
   ↓
révélation
   ↓
comparaison
   ↓
souvenir commun
```

L'IA peut produire une synthèse après révélation, en conservant la distinction entre les deux récits.

Elle ne doit pas décider quelle version est « vraie » sans preuve objective.

---

## 2.15 Page « Nous »

Créer un espace central dans chaque conversation pour toutes les fonctions relationnelles.

```text
                 NOUS
                   │
     ┌─────────────┼─────────────┐
     │             │             │
Boîte à souvenirs Notre histoire Messages temporels
     │             │             │
Journal partagé   Capsules      Promesses
     │             │             │
Questions à deux  Vlog          Dates / lieux
```

La page « Nous » doit être un hub de relation, pas un dashboard analytique froid.

Elle pourra contenir :

- Boîte à souvenirs ;
- Notre histoire ;
- Journal partagé ;
- Messages temporels ;
- Capsules ;
- Questions à deux ;
- Souvenirs croisés ;
- dates importantes ;
- lieux importants ;
- médias partagés ;
- statistiques relationnelles légères et descriptives.

---

## 2.16 Oublier / retirer un souvenir

Les participants doivent garder le contrôle sur leur histoire.

Un souvenir partagé doit pouvoir être :

- supprimé selon les règles définies par le produit ;
- retiré de certaines vues ;
- dissocié d'un événement ;
- retiré des futures narrations IA lorsque nécessaire.

La suppression d'une mémoire manuelle ne doit pas automatiquement supprimer le message original du chat.

Les données supprimées doivent également être exclues des futures analyses lorsque le produit et les obligations de conservation le permettent.

---

# 3. Architecture commune future

Toutes ces fonctionnalités doivent réutiliser les systèmes existants au lieu de créer des architectures parallèles.

```text
                         CHAT À DEUX
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       Messages          Médias              Événements
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ↓
                  RELATIONSHIP MEMORY
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
  Boîte à souvenirs     Journal partagé    Messages temporels
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ↓
                    RELATIONSHIP TIMELINE
                              │
                 ┌────────────┴────────────┐
                 │                         │
          algorithmes déterministes       IA
                 │                         │
                 ↓                         ↓
          preuves / scores          narration / questions
                 │                         │
                 └────────────┬────────────┘
                              ↓
                         PAGE « NOUS »
```

---

# 4. Architecture IA future

L'IA ne doit pas être directement responsable du classement fondamental des événements.

Architecture recommandée :

```text
Données autorisées
      ↓
Privacy / Consent Gate
      ↓
Feature extraction déterministe
      ↓
Evidence selection
      ↓
LLM
      ↓
Structured output
      ↓
Validation
      ↓
UI
```

## Cas d'utilisation IA

### Questions à deux

L'IA génère une question à partir :

- du type de relation ;
- du contexte explicitement autorisé ;
- des thèmes déjà utilisés ;
- du niveau de profondeur choisi ;
- des questions précédentes.

### Narration

L'IA reçoit uniquement les souvenirs sélectionnés par l'algorithme et produit une narration.

### Synthèse de souvenirs croisés

L'IA reçoit les deux récits après révélation et produit une synthèse sans arbitrer artificiellement les versions.

### Personnalisation

L'IA peut adapter le ton :

- léger ;
- romantique ;
- profond ;
- drôle ;
- nostalgique.

Le ton ne change jamais les faits.

---

# 5. Sécurité et confidentialité

Ces fonctionnalités manipulent des données potentiellement très personnelles.

À prévoir avant une mise en production complète :

- contrôle d'accès par conversation ;
- consentement explicite pour les fonctions IA ;
- exclusion des messages supprimés ;
- chiffrement applicatif des contenus temporels si nécessaire ;
- journalisation des accès sensibles ;
- protection contre les accès indirects aux contenus verrouillés ;
- expiration et suppression des données ;
- contrôle du partage des médias ;
- aucune exposition du contenu d'un message temporel avant sa date ;
- aucune réponse privée de Questions à deux accessible avant révélation.

Pour les données extrêmement sensibles, envisager un chiffrement côté application avec des clés qui ne sont pas directement accessibles au modèle IA.

---

# 6. Ordre de priorité proposé

## Phase A — fondations déjà disponibles

- Boîte à souvenirs ;
- Relationship Intelligence V2 ;
- Timeline ;
- Messages temporels ;
- connexion directe message → souvenir.

## Phase B — prochaines fonctionnalités

1. **Page « Nous »**
2. **Questions à deux avec IA**
3. **Capsule temporelle**
4. **Journal partagé**
5. **Souvenirs croisés**

## Phase C — enrichissement

6. Notre première fois
7. Notre histoire enrichie
8. Ce que je voulais te dire
9. Promesses temporelles
10. Retour au même endroit

## Phase D — multimédia et rétrospectives

11. Vlog de relation
12. Timeline émotionnelle
13. Comment on s'est rencontrés
14. Souvenir privé → souvenir partagé
15. Oublier / retirer un souvenir

---

# 7. Règle importante pour le développement

Une nouvelle fonctionnalité relationnelle ne doit être ajoutée que si elle renforce au moins l'un de ces objectifs :

- créer un souvenir ;
- préserver un souvenir ;
- découvrir quelque chose l'un sur l'autre ;
- donner du temps à une conversation ;
- raconter l'histoire commune ;
- renforcer la confiance et le contrôle.

Éviter les fonctionnalités qui transforment la relation en compétition, score permanent ou diagnostic algorithmique.

**Le produit doit aider les deux personnes à écrire leur histoire. Il ne doit pas écrire l'histoire à leur place.**
