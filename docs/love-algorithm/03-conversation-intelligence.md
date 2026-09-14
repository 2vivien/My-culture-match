# 03 — Intelligence conversationnelle Love

## Objectif

La conversation Love devient une source de compréhension progressive. Le système ne doit pas lire une conversation pour « espionner » l'utilisateur : il doit utiliser uniquement les signaux autorisés et transparents, avec contrôle utilisateur et minimisation des données.

## Architecture

```text
Message utilisateur
      ↓
Language detection
      ↓
Intent extraction
      ↓
Topic / preference extraction
      ↓
Sentiment / communication style (coarse)
      ↓
Embedding
      ↓
Feature confidence
      ↓
Temporal memory
      ↓
Compatibility update
```

## Ce que l'IA peut extraire

Exemples de signaux non sensibles :

- intérêts ;
- activités ;
- style de communication déclaré ;
- préférences de rythme relationnel ;
- thèmes de conversation appréciés ;
- objectifs explicitement exprimés ;
- langues utilisées ;
- projets de vie explicitement mentionnés ;
- valeurs explicitement revendiquées.

## Ce qu'elle ne doit pas inférer

Ne pas déduire automatiquement :

- religion ;
- origine ethnique ;
- orientation sexuelle ;
- santé mentale ;
- santé physique ;
- opinions politiques ;
- statut socio-économique ;
- caractéristiques sensibles à partir de la langue, de la photo ou du lieu.

Une préférence explicitement fournie peut être traitée selon les règles produit et de sécurité, mais une hypothèse du modèle ne doit pas devenir une vérité de profil.

## Mémoire par niveaux

### L0 — Session

Contexte de la conversation actuelle.

### L1 — Préférence temporaire

Exemple :

> « En ce moment je préfère quelqu'un qui vit près de moi. »

Expiration possible : 30 jours.

### L2 — Préférence stable

Exemple :

> « J'aime beaucoup voyager. »

Pas d'expiration automatique rapide.

### L3 — Profil explicite

Donnée modifiée volontairement dans les paramètres. Priorité maximale.

## Pondération par source

Une information explicitement configurée doit généralement avoir plus de poids qu'une inférence issue d'une conversation.

```text
explicit > repeated_behavior > conversation > single_message > model_inference
```

## Mise à jour bayésienne simplifiée

Pour une préférence binaire `z` :

```text
P(z | evidence) ∝ P(evidence | z) P(z)
```

En pratique, le système peut conserver une probabilité et une confiance plutôt qu'une valeur booléenne.

Exemple :

```text
travel_interest = 0.88
confidence = 0.93
```

## Embedding conversationnel

Pour un ensemble de messages autorisés :

```text
E_session = mean(E_message_i × w_i)
```

avec un poids temporel :

```text
w_i = exp(-λ Δt_i)
```

Puis :

```text
S_conversation = cosine(E_A, E_B)
```

## Ne pas matcher sur un seul message

Un message isolé peut être ironique, hypothétique ou contextuel.

Utiliser un seuil de répétition :

```text
signal_confidence = base_confidence × repetition_factor × recency_factor
```

Une préférence devient forte lorsqu'elle est :

- déclarée explicitement ; ou
- répétée plusieurs fois ; ou
- confirmée par l'utilisateur.

## Questions de clarification

L'IA peut proposer une question lorsqu'une incertitude change fortement le ranking.

Exemple :

> « Tu préfères quelqu'un qui partage exactement tes passions ou quelqu'un qui t'en fait découvrir de nouvelles ? »

Cette réponse peut modifier le poids `similarity` vs `complementarity`.

## Architecture LLM

Le LLM doit être utilisé pour :

1. extraction structurée ;
2. résumé ;
3. classification de thèmes ;
4. génération d'explications ;
5. détection d'ambiguïté.

Il ne doit pas :

- choisir directement le Top 4 ;
- contourner les règles de sécurité ;
- décider qu'une personne est « bonne » ou « mauvaise » ;
- inventer des attributs absents.

## JSON contractuel

```json
{
  "signals": [
    {
      "feature": "travel",
      "value": 0.91,
      "confidence": 0.88,
      "source": "conversation"
    }
  ],
  "uncertainties": [
    "relationship_pace"
  ],
  "summary": "Personne attirée par les échanges interculturels et les voyages."
}
```

## Privacy by design

Pour un fournisseur externe :

- envoyer le minimum de texte ;
- pseudonymiser les identifiants ;
- ne pas envoyer les messages privés entiers si un extrait anonymisé suffit ;
- ne jamais envoyer des données privées non nécessaires ;
- journaliser quel traitement IA a été effectué ;
- prévoir suppression/retention ;
- permettre une désactivation de l'utilisation conversationnelle pour le matching.

## Recherche de référence

Les systèmes de recommandation modernes combinent contenu, contexte, séquences et interactions. Le *Recommender Systems Handbook* traite explicitement les recommenders people-to-people et le NLP pour recommandation. [1]

1. Recommender Systems Handbook, Springer. https://link.springer.com/book/10.1007/978-1-0716-2197-4
