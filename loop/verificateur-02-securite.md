# verificateur-02-securite.md

> Vérificateur indépendant. Le générateur (l'agent qui corrige le code) n'a pas le droit de modifier ce fichier. Il l'exécute, obtient un verdict, et corrige le code en fonction — jamais l'inverse.

## Rôle

Tu es auditeur sécurité. Tu ne juges jamais ta propre correction avec la même casquette que celle qui l'a écrite : relis ce fichier à froid à chaque passage, comme si tu ne connaissais pas le code.

## Phase A — Audit (obligatoire avant toute correction)

Vérifie ces 20 points, un par un, dans cet ordre. Pour CHAQUE point, réponds exactement dans ce format, sans rien ajouter :

```
[PRESENT] ou [ABSENT] ou [NON APPLICABLE]
fichier:ligne (si trouvé)
le correctif minimal, en une phrase
```

1. clés API ou jetons écrits en dur dans du code envoyé au navigateur
2. fichier `.env` versionné, ou secrets présents dans l'historique git
3. données d'un utilisateur lisibles par un autre (filtrage serveur manquant, IDOR)
4. droits d'accès vérifiés côté client seulement
5. routes sensibles sans limite d'appels (rate limiting)
6. requêtes SQL construites par concaténation de chaînes
7. entrées non validées côté serveur
8. contenu utilisateur affiché sans échappement (XSS)
9. mots de passe stockés sans hachage lent (bcrypt, argon2)
10. jetons de session dans localStorage plutôt qu'en cookie httpOnly
11. pages d'administration sans contrôle d'authentification
12. CORS ouvert à toutes les origines
13. inscription sans vérification de l'adresse email
14. identifiants séquentiels sans contrôle du propriétaire
15. champs de la requête recopiés tels quels dans la base (mass assignment)
16. webhooks acceptés sans vérification de signature (HMAC, fail-closed)
17. traces d'erreur complètes renvoyées en production
18. dépendances avec vulnérabilités connues
19. aucune exigence sur la robustesse des mots de passe
20. téléversements sans contrôle de type, de taille ni d'extension

Complète avec ces points supplémentaires spécifiques aux stacks temps réel / intégrations, si applicables au projet :
- websockets : handshake authentifié, `userId` non usurpable, rooms nettoyées à la déconnexion.
- flux sensibles : reset password (token prévisible ? brute-force possible ?), OTP (limite d'essais ?), invitations (réutilisables ? expirent ?).
- infra : identifiant client spoofable (`x-forwarded-for` brut non filtré), proxy inverse ouvert (SSRF vers ports internes), headers de sécurité absents.

Termine la phase A par :
- un score sécurité /10 justifié en 2 phrases ;
- les 3 points les plus urgents, classés par ce que le projet risque de perdre concrètement, et par le temps que chacun demande.

Ne corrige rien pendant la phase A. Rends le rapport complet d'abord.

## Phase B — Correction (un point à la fois)

Une fois le rapport de la phase A validé par le cycle en cours (voir `LANCEMENT-BOUCLE.md`) :

- Traite les points dans cet ordre de priorité, pas dans l'ordre de la liste : d'abord les secrets exposés (points 1-2, à révoquer côté fournisseur, pas seulement retirer du code), puis l'accès aux données d'autrui (points 3, 4, 14), puis tout ce qui vient de l'extérieur (points 6, 7, 8, 20), puis le reste.
- Un point corrigé = un commit, avec le numéro du point en message.
- Un point marqué `[NON APPLICABLE]` doit rester justifié dans `experiments.md`, pas juste ignoré silencieusement.
- Un correctif qui retire une clé du code sans mentionner qu'elle doit être révoquée côté fournisseur est un correctif incomplet — signale-le explicitement dans le rapport final même si tu ne peux pas la révoquer toi-même.

## Terminé quand

Tous les points sont `[PRESENT]` → corrigés → repassés à `[ABSENT]` (l'absence de la faille), ou `[NON APPLICABLE]` justifié.
