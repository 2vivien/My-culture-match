import { test, expect } from '@playwright/test';

const GSI_SCRIPT = '**/accounts.google.com/gsi/client';

const GOOGLE_LOGIN_RESPONSE = {
  token: 'e2e-google-token',
  user: {
    id: 'e2e-google-user',
    email: 'e2e.google@e2e.local',
    name: 'Google E2E',
    username: null,
    avatar: null,
    emailVerified: true,
    role: 'user',
    bannedAt: null,
  },
  isNewUser: false,
};

test.describe('Connexion sociale', () => {
  test('bouton Google : cliquable, toute la chaîne UI (GSI + POST /api/auth/google) aboutit à l’app', async ({ page }) => {
    // GSI réel bloqué — on injecte un stub qui reproduit initialize()/prompt()/callback
    await page.route(GSI_SCRIPT, (route) => route.abort('failed'));
    await page.addInitScript(() => {
      (window as any).google = {
        accounts: {
          id: {
            _cfg: null,
            initialize(cfg: any) {
              this._cfg = cfg;
            },
            prompt() {
              setTimeout(() => this._cfg?.callback({ credential: 'fake-google-id-token' }), 50);
            },
            cancel() {},
            disableAutoSelect() {},
            renderButton() {},
            revoke() {},
          },
        },
      };
    });

    // La route backend est mockée (la vérification réelle du idToken nécessite un compte Google)
    let payload: unknown = null;
    await page.route('**/api/auth/google', async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(GOOGLE_LOGIN_RESPONSE),
      });
    });

    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();

    await page.getByRole('button', { name: 'Google' }).click();

    await expect(page.locator('nav').getByTitle('Home')).toBeVisible({ timeout: 15_000 });
    expect(payload).toEqual({ idToken: 'fake-google-id-token' });

    const token = await page.evaluate(() => localStorage.getItem('mcm.auth.token'));
    expect(token).toBe('e2e-google-token');
  });

  test('bouton Google : fallback propre si Google Identity Services n’est pas chargé', async ({ page }) => {
    await page.route(GSI_SCRIPT, (route) => route.abort('failed'));
    await page.goto('/');

    const btn = page.getByRole('button', { name: 'Google' });
    await expect(btn).toBeVisible();

    await btn.click();
    await expect(page.getByText('Google Sign-In n\'est pas disponible. Vérifiez la connexion internet.')).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('bouton Apple : message « pas encore disponible »', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('button', { name: 'Apple' });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();

    await btn.click();
    await expect(page.getByText('Connexion Apple pas encore disponible.')).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('tous les boutons/liens de la page de connexion sont visibles et cliquables', async ({ page }) => {
    await page.goto('/');

    const submit = page.getByRole('button', { name: /Continuer/ });
    await expect(submit).toBeVisible();
    await expect(submit).toBeEnabled();

    for (const name of ['Google', 'Apple']) {
      const b = page.getByRole('button', { name });
      await expect(b).toBeVisible();
      await expect(b).toBeEnabled();
    }

    const terms = page.getByText('Conditions d’Utilisation', { exact: true });
    const privacy = page.getByText('Politique de Confidentialité', { exact: true });
    await expect(terms).toBeVisible();
    await expect(privacy).toBeVisible();
  });
});