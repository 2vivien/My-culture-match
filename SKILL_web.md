---
name: react-web-universal
description: Skill universel React/Vite Web pour le projet My Culture Match. Applique systématiquement : composants ≤50 lignes, fichiers ≤120 lignes, zéro duplication, architecture en couches (pages / composants / services / hooks / stores), performance et préservation absolue du design.
---

# React Web (Vite) — Règles de production

Ce document définit les standards de développement pour le projet Web. Chaque fichier créé ou modifié dans le dossier `myculturematch-web/` doit respecter scrupuleusement ces règles.

---

## 1. ARCHITECTURE DES DOSSIERS

```
myculturematch-web/src/
├── pages/             # Pages et orchestration globale (ex: ChatPage, SettingsPage)
├── components/        # Composants de l'application
│   ├── ui/            # Composants atomiques réutilisables (button, input, badge, avatar)
│   ├── layout/        # Composants structurels (Sidebar, Header, Layout containers)
│   └── [feature]/     # Composants métier regroupés par domaine (feed, explore, chat, etc.)
├── hooks/             # Logique réutilisable et intégration de données (ex: useFeed, useMessages)
├── services/          # Appels API, mock data, stockage (ex: userService, requestsService)
├── stores/            # Gestion globale des états UI et App (ex: useUIStore, useAppStore via Zustand)
├── lib/               # Configurations et constantes partagées (animations, utils)
├── types/             # Types et interfaces TypeScript
└── assets/            # Images, icônes statiques, SVG
```

**Règle absolue** : Un fichier = une seule responsabilité. Ne mélangez pas la déclaration de grandes structures de données mockées, la logique d'appel API, les gestionnaires de stores et l'UI dans un même composant.

---

## 2. LIMITES STRICTES DE TAILLE

| Unité | Limite maximale | Action si dépassement |
|---|---|---|
| Composant (JSX) | **50 lignes** | Extraire en sous-composants |
| Hook | **60 lignes** | Découper en hooks plus petits |
| Service | **80 lignes** | Diviser par domaine fonctionnel |
| Fichier total | **120 lignes** | Scinder le fichier obligatoirement |
| Fonction | **20 lignes** | Extraire la logique pure |

*Ces limites garantissent que le code reste lisible, testable et facilement modifiable par l'IA et les humains.*

---

## 3. PRINCIPE DE NON-ALTÉRATION DE L'UI (DESIGN SAFE)

> [!IMPORTANT]
> **INTERDICTION DE MODIFIER LE DESIGN**
> Lors des refactorisations, aucun changement visuel (couleurs, espacements, ombres, animations Framer Motion, interactions) ne doit être introduit. Le rendu final pour l'utilisateur doit être rigoureusement identique. Seule l'architecture du code change pour devenir modulaire et performante.

---

## 4. GESTION DES MOCKS ET SERVICES

- **Pas de mock data inline** : Aucun grand tableau de données simulées ne doit être défini au sein d'un fichier de composant ou de page. Les données doivent être stockées dans des fichiers JSON ou gérées par des services dédiés (`services/`).
- **Services découplés** : Les composants ne consomment pas directement des promesses ou des fetchs. Ils appellent un custom hook ou un store, qui lui-même s'appuie sur un service.

---

## 5. STORES DE DÉCOUPLAGE (ZUSTAND & UI STORES)

- **UI Stores** : L'état visuel global ou partagé (ouverture de modales, onglet actif, barres de recherche, notifications) doit être centralisé dans le store UI (`stores/useUIStore.ts`).
- **App Stores** : Les données globales de l'application (utilisateur connecté, historique de chat actif, fil de posts) doivent utiliser l'App store (`stores/useAppStore.ts`).
- **Isolation de la logique** : Éviter le passage excessif de props de type "prop drilling" en utilisant les sélecteurs de stores Zustand de manière ciblée pour éviter les rerenders inutiles.

---

## 6. MEILLEURES PRATIQUES POUR LE CODE PROPRE

- **Destructuration et typage** : Toutes les props de composants doivent être typées dans des interfaces explicites (ex: `CardProps`).
- **Callbacks stables** : Utiliser `useCallback` pour stabiliser les fonctions passées en props aux composants enfants complexes (pour éviter les rerenders).
- **Mise en cache et mémoïsation** : Utiliser `useMemo` pour filtrer, trier ou transformer des listes avant de les afficher.
- **Accessibilité (a11y)** : S'assurer que les boutons ont des rôles appropriés, et que les SVG décoratifs sont cachés (`aria-hidden="true"`).
