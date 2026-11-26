import { useUIStore } from '@/src/stores/useUIStore';
import { useAppStore } from '@/src/stores/useAppStore';

/**
 * Mini-routeur par hash : chaque vue de l'app a une vraie URL (#/profil/:id,
 * #/tribu/:id, #/explore, ...). Synchronisé dans les deux sens avec les stores
 * (deep-link au chargement + URL mise à jour à chaque navigation).
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
  Admin: 'admin',
};

const SEGMENT_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_SEGMENTS).map(([tab, seg]) => [seg, tab]),
);

/** Construit le hash pour un onglet (+ id optionnel : profil/tribu/post). */
export function buildHash(tab: string, id?: string | null): string {
  const seg = TAB_SEGMENTS[tab] ?? tab.toLowerCase();
  if (tab === 'Profil' && id && id !== 'user-current') return `#/profil/${id}`;
  if (tab === 'Tribu' && id) return `#/tribu/${id}`;
  if (tab === 'PostDetail' && id) return `#/post/${id}`;
  return `#/${seg}`;
}

/** Applique l'état courant des stores à l'URL (sans boucle). */
function syncFromStores() {
  const { activeTab } = useUIStore.getState();
  const { selectedProfileUserId, selectedTribeId, selectedPostId } = useAppStore.getState();
  let id: string | null | undefined;
  if (activeTab === 'Profil') id = selectedProfileUserId;
  else if (activeTab === 'Tribu') id = selectedTribeId;
  else if (activeTab === 'PostDetail') id = selectedPostId;
  const target = buildHash(activeTab, id);
  if (window.location.hash !== target) {
    window.history.replaceState(null, '', target);
  }
}

/** Lit le hash courant et pousse l'état correspondant dans les stores. */
export function applyHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [seg, id] = raw.split('/');
  const tab = SEGMENT_TO_TAB[seg] ?? (seg === '' ? 'Home' : null);

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

/** Active le routeur : deep-link initial + écoute des changements de hash. */
export function startRouter() {
  applyHash();
  window.addEventListener('hashchange', applyHash);

  // Re-synchronise l'URL quand la vue ou la cible (profil/tribu) change —
  // pas à chaque frappe clavier (searchQuery etc.).
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
