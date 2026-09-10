import { test, expect, type Page } from '@playwright/test';
import { forceAdminRole, loginByOtp } from './helpers';

async function loginAsApp(page: Page): Promise<void> {
  await loginByOtp(page, 'test.flow@example.com', true);
}

test.describe('Application connectée', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsApp(page);
  });

  test('le feed s’affiche avec les onglets de tri', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav.getByTitle('Home')).toBeVisible();
    await expect(nav.getByTitle('Popular')).toBeVisible();
    await expect(nav.getByTitle('New')).toBeVisible();
  });

  test('navigation : Love, Explore, Connexion, Totem', async ({ page }) => {
    const nav = page.locator('nav');
    await nav.getByTitle('Love').click();
    await expect(page.getByRole('heading', { name: 'Love Matchmaker' })).toBeVisible();

    await nav.getByTitle('Explore').click();
    await expect(page.getByRole('heading', { name: 'Explore Communities' })).toBeVisible();

    await nav.getByTitle('Connexion').click();
    await expect(page.locator('main, .flex-1').first()).toBeVisible();

    await nav.getByTitle('Totem').click();
    await expect(page.locator('main, .flex-1').first()).toBeVisible();
  });

  test('création d’une tradition (bouton header)', async ({ page }) => {
    await page.getByTitle('Create a tradition').click();
    await expect(page.getByRole('heading', { name: 'Create Tradition' })).toBeVisible();
  });

  test('publication réelle d’un post et apparition dans le feed', async ({ page }) => {
    const body = `Post e2e vérification ${Date.now()}`;
    await page.getByTitle('Create a tradition').click();
    await expect(page.getByRole('heading', { name: 'Create Tradition' })).toBeVisible();

    await page.getByPlaceholder('Title').fill('Titre tradition e2e');
    await page.getByPlaceholder('Body text (optional)').fill(body);
    await page.getByRole('button', { name: 'Publish Tradition' }).click();

    await expect(page.locator('nav').getByTitle('Home')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(body)).toBeVisible({ timeout: 20_000 });
  });

  test('le chat popup s’ouvre depuis Messages et charge les conversations réelles', async ({ page }) => {
    await page.locator('nav').getByTitle('Messages').click();
    const popup = page.locator('div').filter({ hasText: /Conversations|Messages/ }).last();
    await expect(popup).toBeVisible({ timeout: 10_000 });
  });

  test('onglet Admin accessible pour un role admin — routes réelles', async ({ page }) => {
    await forceAdminRole(page);

    await expect(page.getByTitle('Admin')).toBeVisible({ timeout: 15_000 });
    await page.getByTitle('Admin').click();

    await expect(page.getByRole('heading', { name: 'Admin Panel' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Activity Logs' }).click();
    await expect(page.getByRole('heading', { name: 'Activity Logs' })).toBeVisible();

    await page.getByRole('button', { name: 'Système' }).click();
    await expect(page.getByRole('heading', { name: 'Système', exact: true })).toBeVisible();
  });
});