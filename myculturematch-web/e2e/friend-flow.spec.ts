import { test, expect, type Browser, type Page } from '@playwright/test';
import {
  AMINA, FakeWorld, KOFI, LEA,
  installFakeApi, openConnexion, setGeoMode,
} from './support/fakeFriendApi';

/**
 * F12 — parcours Friend : suggestion → demande → acceptation → compagnon → carte.
 *
 * 100 % simulé : aucune API, aucun Redis, aucun OTP (voir support/fakeFriendApi.ts).
 * Prérequis : seulement le serveur Vite (`npm run dev`, http://localhost:5173) et chromium.
 * Chaque test construit son propre monde en mémoire : pas d'ordre ni d'état partagé entre tests.
 */

// MapLibre exige WebGL ; en headless, on autorise explicitement le rendu logiciel (SwiftShader).
test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } });

async function openAs(browser: Browser, world: FakeWorld, userId: string): Promise<Page> {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await installFakeApi(context, world, userId);
  const page = await context.newPage();
  await openConnexion(page);
  return page;
}

const tab = (page: Page, name: RegExp) => page.getByRole('button', { name });
const sharedBanner = (page: Page, text: RegExp) => page.getByText(text);

test.describe('Friend — parcours demande → compagnon → carte (API simulée)', () => {
  test('suggestion, demande, acceptation, compagnon puis carte « partagée avec 1 personne »', async ({ browser }) => {
    // Deux contextes, trois chargements complets de l'app : large marge pour le démarrage à froid de Vite.
    test.setTimeout(240_000);
    const world = new FakeWorld([LEA, KOFI]);

    // 1. Léa voit Kofi en suggestion et lui envoie une demande.
    const lea = await openAs(browser, world, LEA.id);
    await expect(lea.getByRole('heading', { name: KOFI.name })).toBeVisible();

    const requestSent = lea.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith(`/api/connections/${KOFI.id}/request`));
    await lea.getByRole('button', { name: 'Connect', exact: true }).click();
    await requestSent;

    // waitForRequest se résout à l'émission : le journal du faux serveur est rempli un instant plus tard.
    await expect.poll(() => world.callsTo('POST', /\/api\/connections\/u-kofi\/request$/, LEA.id).length).toBe(1);
    // La suggestion disparaît une fois la liste rechargée (la demande est en attente côté serveur).
    await expect(lea.getByRole('heading', { name: KOFI.name })).toHaveCount(0);

    // 2. Kofi, de son côté, voit la demande de Léa et l'accepte.
    const kofi = await openAs(browser, world, KOFI.id);
    await tab(kofi, /^Demandes/).click();
    await expect(tab(kofi, /^Demandes\s*1$/)).toBeVisible();
    await expect(kofi.getByRole('heading', { name: LEA.name })).toBeVisible();

    const accepted = kofi.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith(`/api/requests/${LEA.id}/accept`));
    await kofi.getByRole('button', { name: 'Accept', exact: true }).click();
    await accepted;

    // Changement d'état : la demande quitte « Demandes », Léa devient compagnon.
    await expect(kofi.getByRole('heading', { name: LEA.name })).toHaveCount(0);
    await expect(tab(kofi, /^Demandes$/)).toBeVisible();
    await expect(tab(kofi, /^Compagnons\s*1$/)).toBeVisible();
    await tab(kofi, /^Compagnons/).click();
    await expect(kofi.getByRole('heading', { name: LEA.name })).toBeVisible();

    // 3. Léa recharge : Kofi est compagnon et la carte annonce le partage.
    await openConnexion(lea);
    await tab(lea, /^Compagnons/).click();
    await expect(lea.getByRole('heading', { name: KOFI.name })).toBeVisible();

    await tab(lea, /People Nearby/).click();
    await expect(sharedBanner(lea, /Ta position est partagée avec 1 personne$/)).toBeVisible();
    await expect(lea.getByText('1 personne à proximité')).toBeVisible();

    // Le reste de l'app (feed, tribus, messages…) n'est volontairement pas simulé ; le parcours Friend, si.
    expect(world.unmocked.filter((c) => /\/api\/(connections|requests|location)/.test(c)), 'appels Friend non simulés').toEqual([]);
  });

  test('refuser une demande ne crée aucun compagnon', async ({ browser }) => {
    const world = new FakeWorld([LEA, KOFI]);
    world.link(LEA.id, KOFI.id, 'pending');

    const kofi = await openAs(browser, world, KOFI.id);
    await tab(kofi, /^Demandes/).click();
    await expect(kofi.getByRole('heading', { name: LEA.name })).toBeVisible();

    const declined = kofi.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith(`/api/requests/${LEA.id}/decline`));
    await kofi.getByRole('button', { name: 'Refuse', exact: true }).click();
    await declined;

    await expect(kofi.getByRole('heading', { name: LEA.name })).toHaveCount(0);
    await expect(tab(kofi, /^Compagnons$/)).toBeVisible(); // pas de pastille de compteur
    expect(world.companionsOf(KOFI.id)).toEqual([]);
  });
});

test.describe('Friend — carte People Nearby (API simulée)', () => {
  test('le bandeau « partagé avec N » suit la visibilité (pluriel, inconnus, masqué)', async ({ browser }) => {
    const world = new FakeWorld([LEA, KOFI, AMINA], { [LEA.id]: { visibility: 'nearby' } });
    world.link(LEA.id, KOFI.id, 'accepted');
    world.link(AMINA.id, LEA.id, 'accepted');

    const lea = await openAs(browser, world, LEA.id);
    await expect(sharedBanner(lea, /Ta position est partagée avec 2 personnes et toute personne à proximité/)).toBeVisible();
    await expect(lea.getByText('2 personnes à proximité')).toBeVisible();

    // Mode fantôme : plus de bandeau de partage, un badge « invisible ».
    world.settingsOf(LEA.id).ghostMode = true;
    await openConnexion(lea);
    await expect(lea.getByText('Mode fantôme · invisible')).toBeVisible();
    await expect(lea.getByText(/Ta position est partagée avec/)).toHaveCount(0);
  });

  test('F7 — localisation refusée : message explicite, aucune écriture, puis réessai réussi', async ({ browser }) => {
    const world = new FakeWorld([LEA, KOFI], { [LEA.id]: { sharingEnabled: false } });
    world.link(LEA.id, KOFI.id, 'accepted');

    const lea = await openAs(browser, world, LEA.id);
    await setGeoMode(lea, 'denied');

    await lea.getByRole('button', { name: 'Activer ma localisation' }).click();
    const alert = lea.getByRole('alert');
    await expect(alert).toContainText('Localisation refusée');
    // Un refus du navigateur ne doit rien enregistrer côté serveur.
    expect(world.callsTo('PATCH', /\/api\/location\/settings$/)).toHaveLength(0);
    expect(world.callsTo('PATCH', /\/api\/users\/me\/location$/)).toHaveLength(0);
    expect(world.settingsOf(LEA.id).sharingEnabled).toBe(false);

    // L'utilisateur autorise la localisation puis réessaie.
    await setGeoMode(lea, 'ok');
    await alert.getByRole('button', { name: 'Réessayer' }).click();

    await expect(lea.getByRole('alert')).toHaveCount(0);
    await expect(lea.getByRole('button', { name: 'Activer ma localisation' })).toHaveCount(0);
    await expect(sharedBanner(lea, /Ta position est partagée avec 1 personne$/)).toBeVisible();

    const [settingsWrite] = world.callsTo('PATCH', /\/api\/location\/settings$/, LEA.id);
    expect(settingsWrite.body).toMatchObject({ sharingEnabled: true, ghostMode: false, consent: true });
    expect(world.callsTo('PATCH', /\/api\/users\/me\/location$/, LEA.id)[0].body).toMatchObject({ latitude: 6.37, longitude: 2.35, enabled: true, consent: true });
  });

  test('F7 — position introuvable ou trop longue : messages distincts', async ({ browser }) => {
    const world = new FakeWorld([LEA], { [LEA.id]: { sharingEnabled: false } });
    const lea = await openAs(browser, world, LEA.id);

    await setGeoMode(lea, 'unavailable');
    await lea.getByRole('button', { name: 'Activer ma localisation' }).click();
    await expect(lea.getByRole('alert')).toContainText('Position introuvable');

    await setGeoMode(lea, 'timeout');
    await lea.getByRole('alert').getByRole('button', { name: 'Réessayer' }).click();
    await expect(lea.getByRole('alert')).toContainText('Localisation trop longue');
  });

  test('F7 — erreur de chargement puis rétablissement', async ({ browser }) => {
    const world = new FakeWorld([LEA, KOFI]);
    world.link(LEA.id, KOFI.id, 'accepted');
    world.nearbyFails = true;

    const lea = await openAs(browser, world, LEA.id);
    const alert = lea.getByRole('alert');
    await expect(alert).toContainText('Impossible de charger la carte');
    // Une erreur ne doit pas se faire passer pour « personne à proximité ».
    await expect(lea.getByText(/Personne à proximité/)).toHaveCount(0);

    world.nearbyFails = false;
    await alert.getByRole('button', { name: 'Réessayer' }).click();
    await expect(lea.getByRole('alert')).toHaveCount(0);
    await expect(lea.getByText('1 personne à proximité')).toBeVisible();
  });

  test('F7 — état vide : aucune personne à proximité', async ({ browser }) => {
    const world = new FakeWorld([LEA]);
    const lea = await openAs(browser, world, LEA.id);
    await expect(lea.getByRole('status')).toContainText('Personne à proximité');
    await expect(lea.getByText('0 personne à proximité')).toBeVisible();
  });

  test('F4 — audience : choisir des compagnons précis met à jour le bandeau', async ({ browser }) => {
    const world = new FakeWorld([LEA, KOFI, AMINA]);
    world.link(LEA.id, KOFI.id, 'accepted');
    world.link(LEA.id, AMINA.id, 'accepted');

    const lea = await openAs(browser, world, LEA.id);
    await expect(sharedBanner(lea, /Ta position est partagée avec 2 personnes$/)).toBeVisible();

    await lea.getByRole('button', { name: 'Location et confidentialité' }).click();
    const audience = lea.getByRole('region', { name: 'Qui voit ma position ?' });
    await expect(audience).toBeVisible();

    // Mode « Ces personnes seulement » : la liste des compagnons apparaît, rien n'est coché.
    await audience.getByRole('radio', { name: /Ces personnes seulement/ }).click();
    await expect(audience.getByRole('checkbox')).toHaveCount(2);
    await expect(audience.getByRole('status')).toContainText('personne ne verra ta position');

    await audience.getByRole('checkbox', { name: new RegExp(KOFI.name) }).click();
    await expect(audience.getByRole('checkbox', { name: new RegExp(KOFI.name) })).toHaveAttribute('aria-checked', 'true');
    await expect(audience.getByRole('status')).toHaveCount(0);

    await audience.getByRole('button', { name: 'Enregistrer l’audience' }).click();

    // Le serveur reçoit la liste puis le mode, et la portée recalculée apparaît sur la carte.
    await expect.poll(() => world.settingsOf(LEA.id).audienceMode).toBe('selected');
    expect(world.callsTo('PUT', /\/api\/location\/audience$/, LEA.id)[0].body).toEqual({ memberIds: [KOFI.id] });
    expect(world.audience.get(LEA.id)).toEqual([KOFI.id]);

    await lea.getByRole('button', { name: 'Fermer' }).click();
    await expect(sharedBanner(lea, /Ta position est partagée avec 1 personne$/)).toBeVisible();
  });
});
