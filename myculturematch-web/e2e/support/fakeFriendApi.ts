import type { BrowserContext, Page } from '@playwright/test';

/**
 * API simulée pour les parcours « Friend » (connexions + carte People Nearby).
 *
 * Aucun backend, Redis ni Docker : toutes les requêtes `/api/*` du navigateur sont interceptées
 * par `context.route` et servies par un `FakeWorld` en mémoire. Le monde est partagé entre
 * plusieurs contextes navigateur (un par utilisateur), ce qui permet de jouer les deux côtés
 * d'une demande (expéditeur / destinataire) de façon déterministe.
 *
 * Les chemins et formes de réponse reproduisent les services web :
 * connectionsService.ts, requestsService.ts, PeopleNearbyMapV2.tsx, LocationAudienceSection.tsx.
 */

export type Visibility = 'nobody' | 'friends' | 'friends_of_friends' | 'nearby' | 'everyone';
export type AudienceMode = 'default' | 'selected' | 'except';

export interface FakeUser {
  id: string;
  name: string;
  username: string;
  bio: string;
  country: string;
  matchScore: number;
  latitude: number;
  longitude: number;
}

export interface FakeSettings {
  sharingEnabled: boolean;
  visibility: Visibility;
  precision: 'approximate' | 'area';
  ghostMode: boolean;
  audienceMode: AudienceMode;
  showDistance: boolean;
  showActiveStatus: boolean;
  expiresAt: string | null;
}

export interface RecordedCall {
  /** Identifiant de l'utilisateur dont le navigateur a émis l'appel. */
  as: string;
  method: string;
  path: string;
  search: string;
  body: unknown;
}

type LinkStatus = 'pending' | 'accepted' | 'declined';
interface Link {
  from: string;
  to: string;
  status: LinkStatus;
}

export const LEA: FakeUser = { id: 'u-lea', name: 'Léa Martin', username: 'lea', bio: 'Musique et cuisine du monde', country: 'France', matchScore: 82, latitude: 48.85, longitude: 2.35 };
export const KOFI: FakeUser = { id: 'u-kofi', name: 'Kofi Mensah', username: 'kofi', bio: 'Tisserand, conteur', country: 'Ghana', matchScore: 91, latitude: 5.6, longitude: -0.19 };
export const AMINA: FakeUser = { id: 'u-amina', name: 'Amina Diallo', username: 'amina', bio: 'Danse et poésie', country: 'Senegal', matchScore: 77, latitude: 14.69, longitude: -17.44 };

const defaultSettings = (over: Partial<FakeSettings> = {}): FakeSettings => ({
  sharingEnabled: true,
  visibility: 'friends',
  precision: 'approximate',
  ghostMode: false,
  audienceMode: 'default',
  showDistance: true,
  showActiveStatus: true,
  expiresAt: null,
  ...over,
});

/** État serveur simulé, partagé par tous les contextes d'un même test. */
export class FakeWorld {
  readonly users = new Map<string, FakeUser>();
  readonly links: Link[] = [];
  readonly settings = new Map<string, FakeSettings>();
  readonly audience = new Map<string, string[]>();
  /** Journal de tous les appels interceptés (ordre d'arrivée). */
  readonly calls: RecordedCall[] = [];
  /** Appels `/api/*` non simulés : un test peut vérifier qu'il n'y en a aucun. */
  readonly unmocked: string[] = [];
  /** Quand vrai, GET /api/location/nearby répond 500. */
  nearbyFails = false;

  constructor(users: FakeUser[], settings: Record<string, Partial<FakeSettings>> = {}) {
    for (const u of users) {
      this.users.set(u.id, u);
      this.settings.set(u.id, defaultSettings(settings[u.id]));
    }
  }

  settingsOf(id: string): FakeSettings {
    const s = this.settings.get(id);
    if (!s) throw new Error(`Utilisateur inconnu : ${id}`);
    return s;
  }

  link(from: string, to: string, status: LinkStatus): void {
    this.links.push({ from, to, status });
  }

  private between(a: string, b: string): Link | undefined {
    return this.links.find((l) => (l.from === a && l.to === b) || (l.from === b && l.to === a));
  }

  suggestionsFor(me: string): FakeUser[] {
    return [...this.users.values()].filter((u) => u.id !== me && !this.between(me, u.id));
  }

  incomingFor(me: string): FakeUser[] {
    return this.links.filter((l) => l.to === me && l.status === 'pending').map((l) => this.users.get(l.from)!);
  }

  companionsOf(me: string): FakeUser[] {
    return this.links
      .filter((l) => l.status === 'accepted' && (l.from === me || l.to === me))
      .map((l) => this.users.get(l.from === me ? l.to : l.from)!);
  }

  respond(me: string, requesterId: string, status: 'accepted' | 'declined'): boolean {
    const link = this.links.find((l) => l.from === requesterId && l.to === me && l.status === 'pending');
    if (!link) return false;
    link.status = status;
    return true;
  }

  /** Calque de computeReach (backend/location.policy.ts) pour les seuls compagnons. */
  reachOf(me: string) {
    const s = this.settingsOf(me);
    if (!s.sharingEnabled || s.ghostMode || s.visibility === 'nobody') {
      return { count: 0, friends: 0, friendsOfFriends: 0, scope: 'none', openToStrangers: false };
    }
    const listed = new Set(this.audience.get(me) ?? []);
    const friends = this.companionsOf(me).filter((c) => {
      if (s.audienceMode === 'selected') return listed.has(c.id);
      if (s.audienceMode === 'except') return !listed.has(c.id);
      return true;
    }).length;
    const openToStrangers = s.audienceMode !== 'selected' && (s.visibility === 'nearby' || s.visibility === 'everyone');
    return { count: friends, friends, friendsOfFriends: 0, scope: s.visibility, openToStrangers };
  }

  callsTo(method: string, pathPattern: RegExp, as?: string): RecordedCall[] {
    return this.calls.filter((c) => c.method === method && pathPattern.test(c.path) && (as === undefined || c.as === as));
  }
}

const profileOf = (u: FakeUser) => ({
  id: u.id, name: u.name, username: u.username, avatar: null, bio: u.bio, location: null, country: u.country, matchScore: u.matchScore,
});

const personOf = (u: FakeUser) => ({
  id: u.id, name: u.name, username: u.username, avatar: null, bio: u.bio, country: u.country,
  latitude: u.latitude, longitude: u.longitude, distanceLabel: '≈ 5 km', matchScore: u.matchScore,
  isCompanion: true, isFriendOfFriend: false, isActive: true,
});

/** PNG 1x1 transparent : sert d'avatar et de tuile pour ne dépendre d'aucun réseau externe. */
const PIXEL_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

export type GeoMode = 'ok' | 'denied' | 'unavailable' | 'timeout';

/** Installe les routes de l'API simulée pour l'utilisateur `me` dans ce contexte navigateur. */
export async function installFakeApi(context: BrowserContext, world: FakeWorld, me: string): Promise<void> {
  const self = world.users.get(me);
  if (!self) throw new Error(`Utilisateur inconnu : ${me}`);

  await context.addInitScript(
    ({ token }) => {
      try { window.localStorage.setItem('mcm.auth.token', token); } catch { /* stockage indisponible */ }
      // Géolocalisation pilotée par le test (window.__geoMode) : refus et succès déterministes,
      // sans dépendre des permissions ni de la position réelle du poste.
      const w = window as unknown as { __geoMode?: string };
      w.__geoMode = 'ok';
      const getCurrentPosition = (ok: (p: unknown) => void, fail?: (e: unknown) => void) => {
        const mode = w.__geoMode ?? 'ok';
        const codes: Record<string, number> = { denied: 1, unavailable: 2, timeout: 3 };
        if (mode === 'ok') ok({ coords: { latitude: 6.37, longitude: 2.35, accuracy: 25 }, timestamp: Date.now() });
        else fail?.({ code: codes[mode] ?? 2, message: mode });
      };
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition, watchPosition: () => 0, clearWatch: () => undefined },
      });
    },
    { token: `e2e-token-${me}` },
  );

  // Aucune ressource externe : avatars générés (dicebear) et tuiles de fond de carte.
  await context.route(/(dicebear\.com|tile\.openstreetmap\.org)/, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG }),
  );
  // Temps réel : sans serveur Socket.IO, on coupe proprement les tentatives de connexion.
  await context.route('**/socket.io/**', (route) => route.abort());

  await context.route(
    (url) => url.pathname.startsWith('/api/'),
    async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const path = url.pathname;
      const method = req.method();
      let body: unknown;
      try { body = req.postDataJSON(); } catch { body = undefined; }
      world.calls.push({ as: me, method, path, search: url.search, body });

      const json = (data: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
      const is = (m: string, re: RegExp) => method === m && re.test(path);
      const idIn = (re: RegExp) => decodeURIComponent(re.exec(path)![1]);

      if (is('GET', /^\/api\/auth\/session$/)) {
        return json({ token: `e2e-token-${me}`, user: { id: self.id, email: `${self.username}@e2e.local`, name: self.name, username: self.username, avatar: null, emailVerified: true, role: 'user', bannedAt: null } });
      }
      if (is('GET', /^\/api\/users\/me$/)) {
        return json({ id: self.id, name: self.name, username: self.username, avatar: null, location: '', country: self.country, level: 1, tribes: [], role: 'user' });
      }

      // --- Connexions ---
      if (is('GET', /^\/api\/connections\/suggestions$/)) {
        return json({ suggestions: world.suggestionsFor(me).map((u) => ({ profile: profileOf(u), reason: 'Valeurs communes', sharedTraits: ['Musique'] })), remaining: 0 });
      }
      if (is('GET', /^\/api\/connections\/interested$/)) return json({ success: true, connections: [] });
      if (is('GET', /^\/api\/connections\/requests$/)) {
        return json({ success: true, connections: world.incomingFor(me).map((u) => ({ profile: profileOf(u), status: 'pending', createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-01T10:00:00.000Z' })) });
      }
      if (is('GET', /^\/api\/connections\/companions$/)) {
        return json({ success: true, connections: world.companionsOf(me).map((u) => ({ profile: profileOf(u), status: 'accepted', createdAt: '2026-01-01T10:00:00.000Z', updatedAt: '2026-01-02T10:00:00.000Z' })) });
      }
      if (is('POST', /^\/api\/connections\/([^/]+)\/request$/)) {
        const target = idIn(/^\/api\/connections\/([^/]+)\/request$/);
        if (!world.users.has(target)) return json({ error: { code: 'NOT_FOUND', message: 'Utilisateur introuvable' } }, 404);
        world.link(me, target, 'pending');
        return json({ success: true });
      }
      if (is('POST', /^\/api\/requests\/([^/]+)\/accept$/)) {
        const ok = world.respond(me, idIn(/^\/api\/requests\/([^/]+)\/accept$/), 'accepted');
        return ok ? json({ success: true }) : json({ error: { code: 'NOT_FOUND', message: 'Demande introuvable' } }, 404);
      }
      if (is('POST', /^\/api\/requests\/([^/]+)\/decline$/)) {
        const ok = world.respond(me, idIn(/^\/api\/requests\/([^/]+)\/decline$/), 'declined');
        return ok ? json({ success: true }) : json({ error: { code: 'NOT_FOUND', message: 'Demande introuvable' } }, 404);
      }

      // --- Localisation ---
      if (is('GET', /^\/api\/location\/settings$/)) return json({ success: true, settings: world.settingsOf(me) });
      if (is('PATCH', /^\/api\/location\/settings$/)) {
        Object.assign(world.settingsOf(me), body as Partial<FakeSettings>);
        return json({ success: true, settings: world.settingsOf(me) });
      }
      if (is('PATCH', /^\/api\/users\/me\/location$/)) return json({ success: true });
      if (is('GET', /^\/api\/location\/reach$/)) return json(world.reachOf(me));
      if (is('GET', /^\/api\/location\/nearby$/)) {
        if (world.nearbyFails) return json({ error: { code: 'INTERNAL', message: 'Erreur serveur simulée' } }, 500);
        return json({ success: true, people: world.companionsOf(me).map(personOf) });
      }
      if (is('GET', /^\/api\/location\/audience$/)) {
        const ids = world.audience.get(me) ?? [];
        return json({ success: true, mode: world.settingsOf(me).audienceMode, members: ids.map((id) => profileOf(world.users.get(id)!)) });
      }
      if (is('PUT', /^\/api\/location\/audience$/)) {
        const { memberIds } = body as { memberIds: string[] };
        world.audience.set(me, memberIds);
        return json({ success: true, mode: world.settingsOf(me).audienceMode, members: memberIds.map((id) => profileOf(world.users.get(id)!)) });
      }

      world.unmocked.push(`${method} ${path}`);
      return json({ error: { code: 'NOT_MOCKED', message: `${method} ${path} non simulé` } }, 404);
    },
  );
}

/** Ouvre l'app en tant que `me` (contexte déjà équipé par installFakeApi) et va sur la page Connexion. */
export async function openConnexion(page: Page): Promise<void> {
  await page.goto('/');
  const nav = page.locator('nav').getByTitle('Connexion');
  await nav.waitFor({ state: 'visible', timeout: 20_000 });
  await nav.click();
}

/** Change le résultat de la géolocalisation simulée (effet immédiat au prochain getCurrentPosition). */
export async function setGeoMode(page: Page, mode: GeoMode): Promise<void> {
  await page.evaluate((m) => { (window as unknown as { __geoMode: string }).__geoMode = m; }, mode);
}
