import { test, expect } from '@playwright/test';
import { loginByOtp, uniqueEmail } from './helpers';

test.describe('Authentification (flux réel OTP)', () => {
  test('inscription : un nouvel email atterrit sur l’onboarding', async ({ page }) => {
    const email = uniqueEmail('inscription');
    await loginByOtp(page, email, false);

    await expect(page.getByText('Étape 1 sur 6')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Contrat de communauté MyCultureMatch')).toBeVisible();
  });

  test('connexion : un email existant atterrit sur l’app après vérification OTP', async ({ page }) => {
    await loginByOtp(page, 'test.flow@example.com', true);

    await expect(page.getByTitle('Profile menu')).toBeVisible({ timeout: 15_000 });
  });
});