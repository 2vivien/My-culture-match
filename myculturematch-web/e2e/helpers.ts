import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';

const HERE = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(HERE), '..', '..');
const BACKEND_DIR = process.env.PLAYWRIGHT_BACKEND_DIR ?? path.join(ROOT, 'backend');

function nodeScript(cwd: string, script: string): string {
  return execSync(`node -e "${script}"`, { cwd, encoding: 'utf8', timeout: 15_000 }).trim();
}

/** Supprime les rate-limits OTP (email + IP) et l'ancien code en Redis. */
export function resetOtpState(email: string): void {
  const script =
    `const Redis=require('ioredis');const r=new Redis('redis://localhost:6379');` +
    `(async()=>{try{const keys=await r.keys('otp:send:email:${email}');const ip=await r.keys('otp:send:ip:*');` +
    `const all=[...keys,...ip,'otp:${email}'];if(all.length)await r.del(all);` +
    `console.log('cleared '+all.length);}catch(e){console.error(e.message);process.exit(1);}finally{await r.quit();}})();`;
  nodeScript(BACKEND_DIR, script);
}

/** Lit le dernier code OTP généré pour un email dans Redis. */
export function getLatestOtp(email: string): string {
  const script =
    `const Redis=require('ioredis');const r=new Redis('redis://localhost:6379');` +
    `r.get('otp:${email}').then(v=>{console.log(v?JSON.parse(v).code:'');return r.quit();})` +
    `.catch(e=>{console.error(e.message);process.exit(1);});`;
  const out = nodeScript(BACKEND_DIR, script);
  if (!out) throw new Error(`Aucun code OTP trouvé pour ${email}`);
  return out;
}

export const uniqueEmail = (prefix: string) => `${prefix}.${Date.now()}@e2e.local`;

const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000';

/** Connexion 100% API (OTP lu dans Redis) → token. */
export async function apiOtpLogin(email: string): Promise<string> {
  resetOtpState(email);
  await fetch(`${API_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const code = getLatestOtp(email);
  const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) throw new Error(`verify-otp ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error('verify-otp : aucun token');
  return data.token;
}

/** Crée un compte distant et publie un post Text avec. Retourne token + postId. */
export async function createRemoteUserAndPost(email: string, body: string): Promise<{ token: string; postId: string }> {
  const token = await apiOtpLogin(email);
  const res = await fetch(`${API_URL}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type: 'Text', title: 'Post partagée e2e', body }),
  });
  if (!res.ok) throw new Error(`create post ${res.status}: ${await res.text()}`);
  const post = (await res.json()) as { id: string };
  return { token, postId: post.id };
}

/** Connexion par l'UI : email → OTP (code lu dans Redis) → app attendue. */
export async function loginByOtp(page: Page, email: string, expectApp: boolean) {
  resetOtpState(email);
  await page.goto('/');
  // Le home est le feed réel en visiteur : la connexion s'ouvre en popup.
  await page.getByRole('button', { name: 'Connexion' }).click();
  await expect(page.getByLabel('Adresse Email')).toBeVisible();
  await page.getByLabel('Adresse Email').fill(email);
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByLabel('Code de vérification')).toBeVisible({ timeout: 15_000 });
  const code = getLatestOtp(email);
  await page.getByLabel('Code de vérification').fill(code);
  await page.getByRole('button', { name: 'Vérifier' }).click();

  if (expectApp) {
    await expect(page.locator('nav').getByTitle('Home')).toBeVisible({ timeout: 15_000 });
  }
}

/**
 * Force le rôle admin pour le test en interceptant /api/users/me.
 * Le store n'est plus une source de vérité : la session est restaurée depuis
 * le cookie HttpOnly, donc on simule la réponse API plutôt que localStorage.
 */
export async function forceAdminRole(page: Page): Promise<void> {
  await page.route('**/api/users/me', async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as Record<string, unknown>;
    await route.fulfill({ response, json: { ...body, role: 'admin' } });
  });
  await page.reload();
}