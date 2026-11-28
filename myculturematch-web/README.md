# My Culture Match — Web

Application web Vite + React 19 du réseau social interculturel My Culture Match.

> Ce README remplace le template Google AI Studio qui se trouvait ici. Voir [l'architecture globale](../docs/ARCHITECTURE.md) et le [README racine](../README.md).

## Prérequis

- Node.js 20+
- Backend démarré sur `http://localhost:3000` (ou infrastructure via `docker compose up -d` à la racine)

## Démarrage

```bash
npm install
npm run dev        # http://localhost:5173
```

Le serveur Vite proxifie `/api` vers `http://localhost:3000` (`vite.config.ts`). Les appels utilisent un jeton Bearer lu dans `src/services/auth.token.ts` et ajouté par `src/services/api.ts`.

## Scripts

| Script | Commande | Rôle |
|---|---|---|
| `dev` | `npm run dev` | Serveur de développement sur le port 5173 |
| `build` | `npm run build` | Bundle de production |
| `preview` | `npm run preview` | Prévisualisation du bundle |
| `lint` | `npm run lint` | Typecheck TypeScript (`tsc --noEmit`) |
| `test:e2e` | `npm run test:e2e` | Tests Playwright |

## Organisation du code

```text
src/
├── pages/          # Auth, Onboarding, Connexion, Settings, Admin
├── components/     # Composants par domaine (feed, explore, chat, tribu, totem, …) + ui/
├── hooks/          # Hooks métier (useFeed, useLove, useMessages, …)
├── services/       # Client HTTP et services d'accès aux données
├── stores/         # État global Zustand (useAppStore, useUIStore, …)
├── types/          # Types métier
└── lib/            # Routeur History API, constantes, utilitaires
```

La navigation n'utilise pas React Router : `src/lib/router.ts` synchronise un routeur History API (`/explore`, `/tribu/:id`, `/profil/:id`, `/friends`, …) avec les stores Zustand.

## Bonnes pratiques

Les règles de découpage et de taille des fichiers sont décrites dans [`SKILL_web.md`](../SKILL_web.md). Les limites (50 lignes par composant, 120 lignes par fichier) sont des objectifs de refactoring, pas l'état actuel de tous les fichiers.

## État connu

- Le frontend consomme l'API REST du backend ; le champ `name` du `package.json` (`react-example`) est un résidu de template.
- Le workspace n'a pas de runner de tests unitaires : la logique pure est placée dans `src/lib/` et testée depuis `backend/tests/unit/web/` (import relatif) ; les parcours sont couverts par Playwright (`e2e/`, API simulée via `page.route`).
- La CI web (`.github/workflows/web-ci.yml`) vérifie le typecheck et le build ; la CI backend (`ci.yml`) couvre `backend/**`.
