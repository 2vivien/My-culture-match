# Messages temporels — My Culture Match

## 1. Intention produit

Un **message temporel** est un vrai message écrit aujourd'hui mais qui n'entre dans la conversation que lorsque sa date de révélation est atteinte.

L'objectif n'est pas de créer un simple message programmé. Le temps fait partie de l'expérience de la relation :

- aujourd'hui, une personne écrit quelque chose à son futur elle-même et à l'autre personne ;
- le destinataire peut recevoir une notification indiquant qu'un message temporel existe ;
- le destinataire ne peut jamais lire le contenu avant `revealAt` ;
- avant la date, le message n'existe pas dans l'historique normal du chat ;
- le jour J, le backend révèle automatiquement le message et l'insère dans le chat comme un vrai message ;
- le message conserve son `createdAt` réel et sa date de révélation ;
- une notification de révélation peut alors ouvrir naturellement la conversation.

Exemple :

> « Si dans 6 mois on est toujours ensemble, je te marie. »

Écrit le 14 septembre 2026, révélé le 14 mars 2027.

## 2. UX

### Entrée

Une icône `Clock3` est présente dans l'en-tête du chat et à côté du champ de composition.

Cliquer dessus ouvre **Message temporel**.

Le composeur permet :

- d'écrire le texte librement ;
- de choisir plus tard aujourd'hui, demain, 3 mois, 6 mois ou 1 an ;
- de choisir une date et une heure exactes ;
- de voir la date de révélation exacte avant validation.

Le composeur rappelle explicitement :

> Le destinataire peut savoir qu'un message temporel attend, mais son contenu reste verrouillé jusqu'au jour J.

### Notification avant le jour J

La notification utilise le système global de notifications existant. Elle compte donc dans le badge global (`1`, `2`, … `99+`).

La notification ne contient jamais le texte du message et ne possède pas de cible de conversation exploitable avant la révélation.

Exemple :

> Vivien vous a écrit un message temporel à découvrir plus tard.

Le clic sur cette notification ne donne pas accès au contenu.

### Révélation

À `revealAt`, le worker :

1. récupère les messages arrivés à échéance ;
2. réserve chaque message pour éviter une double révélation ;
3. crée un vrai enregistrement dans `messages` ;
4. marque le message temporel comme révélé ;
5. incrémente le non-lu de la conversation ;
6. met à jour `conversations.last_message_at` ;
7. émet `message:new` via WebSocket ;
8. émet une notification `temporal_revealed` ;
9. informe l'auteur via `temporal-message:revealed`.

Le message apparaît alors dans le chat comme n'importe quel autre message.

## 3. Architecture

```text
Chat
  │
  ├── Clock3
  │      ↓
  │  TemporalMessageComposer
  │      ↓
  │  POST /api/conversations/:id/temporal-messages
  │      ↓
  │  temporal_messages
  │      │
  │      ├── contenu caché
  │      ├── sender_id
  │      ├── recipient_id
  │      ├── created_at
  │      └── reveal_at
  │
  ├── Notification globale
  │      └── badge 1…99+
  │
  └── BullMQ / temporal-message.reveal
           ↓
       revealAt atteint
           ↓
       INSERT messages
           ↓
       WebSocket message:new
           ↓
       Chat normal
```

## 4. Sécurité de lecture

La règle principale est **server-side** : le destinataire ne doit jamais recevoir le contenu avant `revealAt`.

Le service ne propose pas d'endpoint permettant au destinataire de récupérer le texte verrouillé. La liste temporelle renvoie :

- les messages programmés par l'utilisateur courant ;
- uniquement un compteur `lockedCount` pour les messages qui lui sont destinés.

Le contenu d'un message temporel n'est donc pas caché uniquement dans l'interface.

La conversation est actuellement volontairement limitée aux conversations à deux participants afin de conserver une sémantique claire : un auteur, un destinataire.

## 5. Modèle PostgreSQL

Table : `temporal_messages`

- `id`
- `conversation_id`
- `sender_id`
- `recipient_id`
- `type`
- `text`
- `media_url`
- `audio_dur`
- `file`
- `reveal_at`
- `processing_at`
- `revealed_at`
- `revealed_message_id`
- `cancelled_at`
- `created_at`

Indexes :

- échéances non révélées ;
- messages de l'auteur ;
- messages du destinataire ;
- conversation + date ;
- traitement des révélations.

Migrations :

- `0018_temporal_messages.sql`
- `0019_temporal_message_processing.sql`

## 6. API

### Créer

`POST /api/conversations/:id/temporal-messages`

```json
{
  "text": "Si dans 6 mois on est toujours ensemble, je te marie.",
  "type": "text",
  "revealAt": "2027-03-14T19:00:00.000Z"
}
```

### Lister

`GET /api/conversations/:id/temporal-messages`

Réponse :

```json
{
  "sent": [],
  "lockedCount": 1
}
```

`sent` est réservé aux messages créés par l'utilisateur courant. `lockedCount` ne contient aucun contenu.

### Annuler

`DELETE /api/conversations/:id/temporal-messages/:temporalMessageId`

L'auteur peut annuler un message tant qu'il n'a pas été révélé.

## 7. États

```text
pending
   │
   ├── cancel → cancelled
   │
   └── revealAt atteint → revealed
```

`processing_at` protège contre les doubles traitements lorsque plusieurs instances du backend tournent en parallèle.

## 8. Notifications

Les messages temporels réutilisent le système de notifications existant avec `type = system` et des actions dédiées :

- `temporal_pending`
- `temporal_revealed`

Le contenu du message n'est jamais placé dans `metadata` de la notification.

Avant le jour J, la notification est informative et non navigable vers le contenu.

Après révélation, la notification peut cibler la conversation afin que l'utilisateur puisse retrouver le vrai message.

## 9. Relation avec Relationship Memory

Un message temporel n'est pas une entrée de la **Boîte à souvenirs** au moment où il est programmé.

Il devient un vrai message du chat au moment de sa révélation. À partir de là, les mécanismes existants de `relationship-memory` peuvent l'utiliser comme n'importe quel autre message réel.

Cela permet ensuite de retrouver, dans la timeline de la relation, des moments comme :

- première discussion ;
- message écrit plusieurs mois avant sa révélation ;
- promesse ou réflexion faite au début de la relation ;
- retour émotionnel sur une période passée.

Le système ne doit toutefois pas inventer une signification : les algorithmes et le LLM ne font que travailler à partir des messages effectivement disponibles après révélation.

## 10. Temps et vérité du message

Deux dates doivent toujours être distinguées :

- `createdAt` : moment réel où l'auteur a écrit le message temporel ;
- `revealAt` : moment où le destinataire a le droit de le découvrir.

La révélation ne réécrit pas l'histoire : elle ajoute le message au chat au moment où il devient lisible tout en conservant son origine temporelle côté données.

## 11. Évolution future

Le socle permet ensuite d'ajouter :

- photos et vidéos temporelles ;
- notes vocales temporelles ;
- capsules temporelles liées à la Boîte à souvenirs ;
- plusieurs révélations dans une même journée ;
- anniversaire de rencontre ;
- règles relatives comme « dans 6 mois » ;
- expérience mobile avec push natif ;
- historique privé des messages temporels envoyés ;
- compteur de messages temporels en attente côté auteur.

Ces extensions doivent conserver la règle fondamentale : **aucun client destinataire ne doit pouvoir obtenir le contenu avant `revealAt`.**
