import { test, expect, type Page } from '@playwright/test';
import { forceAdminRole, loginByOtp, createRemoteUserAndPost, uniqueEmail } from './helpers';

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

  test('navigation : Love, Explore, Connexion, Profile', async ({ page }) => {
    const nav = page.locator('nav');
    await nav.getByTitle('Love').click();
    await expect(page.getByRole('heading', { name: /Faisons connaissance|Matchmaking conversationnel/ })).toBeVisible();

    await nav.getByTitle('Explore').click();
    await expect(page.getByRole('heading', { name: 'Explore Communities' })).toBeVisible();

    await nav.getByTitle('Friends').click();
    await expect(page.locator('main, .flex-1').first()).toBeVisible();

    await nav.getByTitle('Profil').click();
    await expect(page.locator('main, .flex-1').first()).toBeVisible();
  });

  test('création d’un post (bouton header)', async ({ page }) => {
    await page.getByTitle('Create a post').click();
    await expect(page.getByRole('heading', { name: 'Create Post' })).toBeVisible();
  });

  test('publication via l’UI : formulaire + bouton Publish Post → retour Home', async ({ page }) => {
    await page.getByTitle('Create a post').click();
    await expect(page.getByRole('heading', { name: 'Create Post' })).toBeVisible();

    await page.getByPlaceholder('Title').fill('Titre post e2e');
    await page.getByPlaceholder('Body text (optional)').fill(`Post e2e vérification ${Date.now()}`);
    await page.getByRole('button', { name: 'Publish Post' }).click();

    await expect(page.locator('nav').getByTitle('Home')).toBeVisible({ timeout: 15_000 });
  });

  test('boutons d’interaction sur un post réel d’un autre utilisateur (flag + menu)', async ({ page }) => {
    const body = `Partage communautaire e2e ${Date.now()}`;
    const created = await createRemoteUserAndPost(uniqueEmail('e2e-post-author'), body);

    try {
      // Tri "Hot" = filtre for-you → posts des autres utilisateurs (l'auteur est exclu de son propre feed)
      await page.getByRole('button', { name: 'Best', exact: true }).click();
      await page.locator('main div.w-40').getByText('Hot', { exact: true }).click();

      const post = page.locator('article').filter({ hasText: body });
      await expect(post).toBeVisible({ timeout: 20_000 });

      // Bouton like ("flag") : clic → "1", re-clic → "flag" (POST /api/posts/:id/like)
      const flag = post.getByRole('button', { name: 'flag', exact: true });
      await expect(flag).toBeVisible();
      await flag.click();
      await expect(post.getByRole('button', { name: '1', exact: true })).toBeVisible({ timeout: 10_000 });
      await post.getByRole('button', { name: '1', exact: true }).click();
      await expect(post.getByRole('button', { name: 'flag', exact: true })).toBeVisible({ timeout: 10_000 });

      // Menu "..." du post : Save / Mute / Report sont cliquables (terrain réel)
      const menuBtn = post.getByRole('button').nth(0);
      await menuBtn.click();
      await post.getByText('Save this Post').click();
      await expect(post.getByText('Post Saved!')).toBeVisible();
      await page.waitForTimeout(900);

      await menuBtn.click();
      await post.getByText('Mute Notifications').click();
      await expect(post.getByText('Muted Author')).toBeVisible();
      await page.waitForTimeout(900);

      page.once('dialog', (d) => d.accept());
      await menuBtn.click();
      await post.getByText('Report Content').click();
    } finally {
      // Nettoyage : suppression du post créé pour ne pas gonfler le feed for-you
      await fetch(`http://localhost:3000/api/posts/${created.postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${created.token}` },
      }).catch(() => {});
    }
  });

  test('le chat popup s’ouvre depuis Messages et charge les conversations réelles', async ({ page }) => {
    await page.getByTitle('Messages').click();
    await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByPlaceholder('Rechercher...')).toBeVisible({ timeout: 10_000 });
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