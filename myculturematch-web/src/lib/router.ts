import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';

/**
 * Routeur SPA avec de vraies URLs (History API) : /profil/:id, /tribu/:id,
 * /post/:id, /explore, /love… Aucun '#' dans l'adresse.
 * Les stores restent la source de vérité ; l'URL se synchronise dans les deux sens.
 */

const TAB_SEGMENTS: Record<string, string> = {
  Home: '',
  Feed: '',
  Popular: 'popular',
  New: 'new',
  Explore: 'explore',
  Friends: 'friends',
  Connexion: 'friends',
  Love: 'love',
  Tribu: 'tribu',
  TribuSettings: 'tribu/settings',
  Profil: 'profil',
  Messages: 'messages',
  Create: 'create',
  PostDetail: 'post',
  Settings: 'settings',
  Notifications: 'notifications',
  About: 'about',
  Admin: 'admin',
};

const SEGMENT_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_SEGMENTS).map(([tab, seg]) => [seg, tab]),
);

/** Construit le chemin pour un onglet (+ id optionnel : profil/tribu/post). */
export function buildPath(tab: string, id?: string | null): string {
  const seg = TAB_SEGMENTS[tab] ?? tab.toLowerCase();
  if (tab === 'Profil' && id && id !== 'user-current') return `/profil/${id}`;
  if (tab === 'Tribu' && id) return `/tribu/${id}`;
  if (tab === 'PostDetail' && id) return `/post/${id}`;
  return seg ? `/${seg}` : '/';
}

/** Compatibilité : ancien nom, même valeur (sans '#'). */
export const buildHash = buildPath;

/** Applique l'état courant des stores à l'URL (sans boucle ni nouvel entrée). */
function syncFromStores() {
  const { activeTab } = useUIStore.getState();
  const { selectedProfileUserId, selectedTribeId, selectedPostId } = useAppStore.getState();
  let id: string | null | undefined;
  if (activeTab === 'Profil') id = selectedProfileUserId;
  else if (activeTab === 'Tribu') id = selectedTribeId;
  else if (activeTab === 'PostDetail') id = selectedPostId;
  const target = buildPath(activeTab, id);
  if (window.location.pathname !== target) {
    window.history.replaceState(null, '', target);
  }
}

/** Navigation explicite (lien cliqué) : pousse une entrée dans l'historique. */
export function navigate(tab: string, id?: string | null): void {
  const target = buildPath(tab, id);
  if (window.location.pathname !== target) {
    window.history.pushState(null, '', target);
  }
  applyRoute();
}

/** Lit l'URL courante et pousse l'état correspondant dans les stores. */
export function applyRoute() {
  const raw = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const [seg, id] = raw.split('/');
  const tab = SEGMENT_TO_TAB[seg ?? ''] ?? (seg === undefined || seg === '' ? 'Home' : null);

  if (tab === 'Profil' && id) {
    useAppStore.getState().setSelectedProfileUserId(id);
    useUIStore.getState().setActiveTab('Profil');
    return;
  }
  if (tab === 'Tribu' && id) {
    useAppStore.getState().setSelectedTribeId(id);
    useUIStore.getState().setActiveTab('Tribu');
    return;
  }
  if (tab === 'PostDetail' && id) {
    useAppStore.getState().setSelectedPostId(id);
    useUIStore.getState().setActiveTab('PostDetail');
    return;
  }
  if (tab === 'TribuSettings') {
    useUIStore.getState().setActiveTab('TribuSettings');
    return;
  }
  if (tab) {
    useUIStore.getState().setActiveTab(tab);
    if (tab === 'Profil') useAppStore.getState().setSelectedProfileUserId('user-current');
  }
}

/** Compatibilité : ancien nom public. */
export const applyHash = applyRoute;

/** Active le routeur : deep-link initial, back/forward et synchro stores. */
export function startRouter() {
  applyRoute();
  window.addEventListener('popstate', applyRoute);

  useUIStore.subscribe((state, prev) => {
    if (state.activeTab !== prev.activeTab) syncFromStores();
  });
  useAppStore.subscribe((state, prev) => {
    if (
      state.selectedProfileUserId !== prev.selectedProfileUserId ||
      state.selectedTribeId !== prev.selectedTribeId ||
      state.selectedPostId !== prev.selectedPostId
    ) {
      syncFromStores();
    }
  });
}

export { syncFromStores };
