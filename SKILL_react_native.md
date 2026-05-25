---
name: react-native-universal
description: Skill universel React Native production-grade pour des apps à millions d'utilisateurs. Applique systématiquement : composants ≤50 lignes, fichiers ≤100 lignes, zéro duplication, architecture en couches (pages / composants / services / hooks / context), performances, accessibilité et sécurité.
---

# React Native — Règles universelles de production

Ce document est **la loi**. Chaque fichier généré doit la respecter intégralement, sans exception ni raccourci.

---

## 1. ARCHITECTURE DES DOSSIERS

```
src/
├── app/               # Navigation root, providers globaux
├── screens/           # Une screen = une page (jamais de logique UI inline)
├── components/
│   ├── ui/            # Atomes réutilisables (Button, Text, Input…)
│   └── features/      # Composants métier composés d'atomes
├── hooks/             # Toute logique réutilisable → custom hook
├── services/          # API calls, storage, auth, analytics
├── stores/            # État global (Zustand / Redux Toolkit)
├── context/           # React Context uniquement pour état UI global léger
├── utils/             # Fonctions pures, helpers, formatters
├── constants/         # Couleurs, espacements, strings, endpoints
├── types/             # Types & interfaces TypeScript globaux
└── assets/            # Images, fonts, icônes
```

**Règle absolue** : un fichier = une seule responsabilité. Jamais de mélange logique + UI + appel API dans le même fichier.

---

## 2. LIMITES STRICTES DE TAILLE

| Unité | Limite maximale | Action si dépassement |
|---|---|---|
| Composant (JSX) | **50 lignes** | Extraire des sous-composants |
| Hook | **60 lignes** | Découper en hooks plus petits |
| Service | **80 lignes** | Séparer en modules distincts |
| Fichier total | **100 lignes** | Diviser obligatoirement |
| Fonction/méthode | **20 lignes** | Extraire |
| Props d'un composant | **6 props max** | Grouper dans un objet typé |

Ces limites ne sont pas négociables. Elles garantissent lisibilité, testabilité et maintenabilité à grande échelle.

---

## 3. COMPOSANTS — RÈGLES FONDAMENTALES

### 3.1 Structure d'un composant

```tsx
// ✅ CORRECT — composant pur, ≤50 lignes, props typées
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { CardProps } from './Card.types';

export function Card({ title, subtitle, onPress }: CardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <AppText variant="heading">{title}</AppText>
      {subtitle && <AppText variant="caption">{subtitle}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
  },
});
```

### 3.2 Ce qui est INTERDIT dans un composant

```tsx
// ❌ INTERDIT — logique métier inline
export function UserCard({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch(`/api/users/${userId}`).then(r => r.json()).then(setUser);
  }, [userId]);
  // ...
}

// ✅ CORRECT — logique dans un hook dédié
export function UserCard({ userId }: { userId: string }) {
  const { user, isLoading } = useUser(userId);
  // composant pur, affichage uniquement
}
```

### 3.3 Zéro duplication UI

- Chaque pattern visuel récurrent (bouton, badge, avatar, séparateur) → **composant `ui/`**
- Avant de créer un composant, **vérifier qu'il n'existe pas déjà**
- Un composant `ui/` doit fonctionner sans connaissance du métier
- Nommage explicite : `PrimaryButton`, `AvatarCircle`, `SectionHeader` — jamais `Button2`, `NewCard`

---

## 4. HOOKS — RÈGLES

```tsx
// ✅ Structure standard d'un custom hook
export function useUserProfile(userId: string) {
  const [state, setState] = useState<UserProfileState>(INITIAL_STATE);

  const fetchProfile = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    const result = await userService.getProfile(userId);
    setState(prev => ({ ...prev, ...result, isLoading: false }));
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return { ...state, refetch: fetchProfile };
}
```

**Règles hooks :**
- Préfixe `use` obligatoire
- Retourner un objet nommé (jamais un tableau sauf `[value, setter]`)
- Toujours gérer `isLoading`, `error`, `data`
- `useCallback` sur toute fonction retournée
- `useMemo` sur tout calcul coûteux
- Ne jamais appeler un service directement dans un composant — toujours via un hook

---

## 5. SERVICES — RÈGLES

```tsx
// src/services/userService.ts
import { apiClient } from './apiClient';
import type { User, UserProfile } from '@/types';

export const userService = {
  async getProfile(userId: string): Promise<UserProfile> {
    return apiClient.get(`/users/${userId}/profile`);
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    return apiClient.patch(`/users/${userId}`, data);
  },
};
```

**Règles services :**
- Services = fonctions pures, sans état, sans hooks React
- Un fichier de service par domaine métier : `authService`, `userService`, `paymentService`
- Toute la gestion d'erreur centralisée dans `apiClient`
- Pas de `console.log` en production — utiliser un logger dédié
- Typer tous les retours, jamais de `any`

---

## 6. GESTION D'ÉTAT

### 6.1 Quand utiliser quoi

| Besoin | Solution |
|---|---|
| État local simple (toggle, input) | `useState` |
| État dérivé coûteux | `useMemo` |
| État partagé entre 2-3 composants proches | Lift state + props |
| État UI global (thème, modal, toast) | `React Context` |
| État serveur (fetch, cache, sync) | `React Query` / `SWR` |
| État global complexe (panier, auth, user) | `Zustand` ou `Redux Toolkit` |

### 6.2 Context — usage strict

```tsx
// ✅ Context uniquement pour état UI transversal
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

**Interdit** : mettre des appels API ou de la logique métier dans un Context.

---

## 7. NAVIGATION

```tsx
// ✅ Typage strict des routes
export type RootStackParams = {
  Home: undefined;
  Profile: { userId: string };
  Settings: { section?: string };
};

// ✅ useNavigation typé
const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();

// ✅ useRoute typé
const { params } = useRoute<RouteProp<RootStackParams, 'Profile'>>();
```

**Règles navigation :**
- Toutes les routes typées dans un fichier `navigation.types.ts`
- Jamais de `navigation.navigate('SomeScreen')` sans typage
- Les screens ne contiennent jamais de logique de navigation complexe — utiliser un hook `useNavigation*`
- Deep linking configuré dès le départ

---

## 8. PERFORMANCES — POUR DES MILLIONS D'UTILISATEURS

### 8.1 Mémoïsation

```tsx
// ✅ Toujours memo sur les composants lourds ou listes
export const UserCard = memo(function UserCard({ user }: UserCardProps) {
  // ...
});

// ✅ Stabiliser les callbacks passés en props
const handlePress = useCallback(() => {
  onSelect(item.id);
}, [item.id, onSelect]);

// ✅ Données dérivées calculées une fois
const sortedItems = useMemo(() =>
  [...items].sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);
```

### 8.2 FlatList — règles obligatoires

```tsx
<FlatList
  data={items}
  keyExtractor={keyExtractor}          // ✅ stable, jamais index
  renderItem={renderItem}              // ✅ mémoïsé avec useCallback
  getItemLayout={getItemLayout}        // ✅ si hauteur fixe
  initialNumToRender={10}              // ✅ limiter le rendu initial
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews                // ✅ Android
/>
```

### 8.3 Images

```tsx
// ✅ Toujours utiliser FastImage avec cache
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri, priority: FastImage.priority.normal, cache: FastImage.cacheControl.immutable }}
  style={styles.image}
  resizeMode={FastImage.resizeMode.cover}
/>
```

### 8.4 Règles de performance générales

- Pas de fonctions anonymes inline dans le JSX (`onPress={() => ...}` → `useCallback`)
- Pas de `StyleSheet` inline dans le render — toujours `StyleSheet.create` hors du composant
- Pas d'import `*` — toujours des imports nommés pour le tree-shaking
- Lazy loading des screens via `React.lazy` / dynamic import
- Hermes activé obligatoirement
- Surveiller les rerenders avec React DevTools Profiler

---

## 9. TYPESCRIPT — RÈGLES STRICTES

```tsx
// ✅ Types dans des fichiers dédiés par feature
// src/types/user.types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'member' | 'guest';

// ✅ Props typées séparément du composant
// Card.types.ts
export interface CardProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}
```

**Interdit :**
- `any` — utiliser `unknown` puis narrowing
- `// @ts-ignore` — corriger le vrai problème
- Types inline complexes dans le JSX
- `as Type` sans vérification préalable

---

## 10. GESTION D'ERREURS

```tsx
// ✅ Error Boundary obligatoire autour des sections critiques
class FeatureErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    errorService.report(error, info);
  }

  render() {
    if (this.state.hasError) return <ErrorFallback onRetry={this.reset} />;
    return this.props.children;
  }
}

// ✅ Pattern Result pour les services
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

async function getUser(id: string): Promise<Result<User>> {
  try {
    const data = await apiClient.get<User>(`/users/${id}`);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: toAppError(error) };
  }
}
```

---

## 11. ACCESSIBILITÉ (a11y)

```tsx
// ✅ Obligatoire sur tous les éléments interactifs
<TouchableOpacity
  accessible
  accessibilityRole="button"
  accessibilityLabel="Envoyer le message"
  accessibilityHint="Double-tapez pour envoyer"
  onPress={handleSend}
>
  <SendIcon />
</TouchableOpacity>

// ✅ Images décoratives masquées
<Image
  source={decorativeImage}
  accessibilityElementsHidden
  importantForAccessibility="no-hide-descendants"
/>
```

**Règles a11y :**
- `accessibilityLabel` sur tout élément sans texte visible
- `accessibilityRole` sur tous les éléments interactifs
- Taille minimale touchable : 44×44 pts
- Contraste couleurs : ratio ≥ 4.5:1 (texte normal), ≥ 3:1 (grand texte)
- Support VoiceOver / TalkBack testé à chaque feature

---

## 12. SÉCURITÉ

```tsx
// ✅ Stockage sécurisé des tokens
import * as SecureStore from 'expo-secure-store';
// ou react-native-keychain

// ✅ Jamais de données sensibles dans AsyncStorage
// ✅ Jamais de secrets hardcodés — utiliser les variables d'environnement
// ✅ Certificate pinning en production
// ✅ Obfuscation du code en production (Hermes + ProGuard)
// ✅ Jailbreak/Root detection pour apps sensibles

// ✅ Sanitizer sur tout input utilisateur
const safeText = input.replace(/<[^>]*>/g, '').trim().slice(0, MAX_LENGTH);
```

---

## 13. TESTS

```
src/
└── __tests__/
    ├── components/    # Test rendu + interactions
    ├── hooks/         # Test logique avec renderHook
    ├── services/      # Test unitaire avec mocks
    └── utils/         # Test fonctions pures
```

```tsx
// ✅ Test d'un hook
it('should fetch user on mount', async () => {
  const { result } = renderHook(() => useUser('123'));
  expect(result.current.isLoading).toBe(true);
  await waitForNextUpdate();
  expect(result.current.user).toEqual(mockUser);
});

// ✅ Test d'un composant
it('renders title correctly', () => {
  render(<Card title="Test" />);
  expect(screen.getByText('Test')).toBeTruthy();
});
```

**Couverture minimale :**
- Hooks : 90%
- Services / utils : 95%
- Composants critiques : 80%

---

## 14. CONVENTIONS DE NOMMAGE

| Élément | Convention | Exemple |
|---|---|---|
| Composant | PascalCase | `UserProfileCard` |
| Hook | camelCase + `use` | `useUserProfile` |
| Service | camelCase + `Service` | `userService` |
| Store | camelCase + `Store` | `userStore` |
| Context | PascalCase + `Context` | `ThemeContext` |
| Types/Interfaces | PascalCase | `UserProfile`, `CardProps` |
| Constante | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Fichier composant | PascalCase | `UserCard.tsx` |
| Fichier hook/service | camelCase | `useUser.ts`, `userService.ts` |
| Fichier de types | kebab ou camelCase + `.types.ts` | `user.types.ts` |

---

## 15. CHECKLIST AVANT CHAQUE FICHIER GÉNÉRÉ

Avant de valider tout fichier, vérifier **chaque point** :

- [ ] Fichier ≤ 100 lignes
- [ ] Composant ≤ 50 lignes
- [ ] Aucune logique métier dans un composant (→ hook)
- [ ] Aucun appel API dans un composant ou hook (→ service)
- [ ] Aucun type `any`
- [ ] Props typées dans un fichier `.types.ts` dédié si > 3 props
- [ ] `StyleSheet.create` hors du composant
- [ ] Pas de valeur magique inline (→ constante nommée)
- [ ] `accessibilityLabel` sur tous les éléments interactifs sans texte
- [ ] Composant `memo` si reçoit des callbacks ou données de liste
- [ ] Callbacks stabilisés avec `useCallback`
- [ ] Aucun `console.log` (→ logger de service)
- [ ] Aucun secret ou clé hardcodée
- [ ] Import nommés, pas de `import *`
- [ ] Le composant ou hook est dans le bon dossier selon l'architecture

---

## 16. ANTI-PATTERNS — JAMAIS FAIRE

```tsx
// ❌ Logique dans le JSX
{items.map(item => item.active && item.score > 5 ? <Card key={item.id} /> : null}
// ✅ Calculer avant le return
const visibleItems = useMemo(() => items.filter(i => i.active && i.score > 5), [items]);

// ❌ useEffect pour dériver de l'état
useEffect(() => { setFullName(`${firstName} ${lastName}`); }, [firstName, lastName]);
// ✅ useMemo
const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);

// ❌ Nest de composants dans un composant
function Parent() {
  function Child() { return <View />; } // recréé à chaque render
  return <Child />;
}

// ❌ Mutation directe du state
state.items.push(newItem); // ❌
setState(prev => ({ ...prev, items: [...prev.items, newItem] })); // ✅

// ❌ Key basée sur l'index dans une liste dynamique
items.map((item, index) => <Card key={index} />) // ❌
items.map(item => <Card key={item.id} />) // ✅
```

---

## 17. STRUCTURE D'UNE SCREEN

```
screens/Profile/
├── ProfileScreen.tsx      # Assemblage uniquement, ≤50 lignes
├── ProfileScreen.types.ts # Types de la screen
├── components/
│   ├── ProfileHeader.tsx  # Sous-composant dédié
│   └── ProfileStats.tsx
└── useProfileScreen.ts    # Toute la logique de la screen
```

```tsx
// ✅ ProfileScreen.tsx — pure orchestration
export function ProfileScreen() {
  const { user, isLoading, error } = useProfileScreen();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!user) return <EmptyState />;

  return (
    <ScreenWrapper>
      <ProfileHeader user={user} />
      <ProfileStats user={user} />
    </ScreenWrapper>
  );
}
```

---

## 18. INTERNATIONALISATION (i18n)

```tsx
// ✅ Aucune chaîne hardcodée dans les composants
import { useTranslation } from 'react-i18next';

export function WelcomeBanner() {
  const { t } = useTranslation('home');
  return <AppText>{t('welcome.title')}</AppText>;
}
```

**Règles i18n :**
- Toutes les chaînes dans des fichiers de traduction JSON par namespace
- Clés descriptives : `home.welcome.title`, pas `str_001`
- Formatage de dates/monnaies via les APIs d'i18n, jamais manuellement
- RTL supporté dès le premier jour

---

> **Rappel final** : Ces règles existent pour garantir que le code est maintenable, performant et scalable pour des millions d'utilisateurs. Chaque règle a une raison précise. Aucune exception sans justification documentée.
