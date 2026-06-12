/**
 * AUDIT BOUTONS — Vérification de toutes les actions critiques
 *
 * AUTH
 *   AUTH-01 : /auth affiche le choix Client / Prestataire
 *   AUTH-02 : "Je suis Client" → formulaire de connexion visible
 *   AUTH-03 : login form → toggle "S'inscrire" → formulaire inscription visible
 *   AUTH-04 : login form → "Mot de passe oublié ?" → /reset-password
 *
 * NAVIGATION
 *   NAV-01  : NewHero CTA "Réserver maintenant" → /services
 *   NAV-02  : Navbar "Connexion" → /auth
 *   NAV-03  : NewHero CTA "Devenir prestataire" → /nous-recrutons
 *   FOOTER-01: Footer lien CGU → /cgu
 *   FOOTER-02: Footer lien mentions légales → /mentions-legales
 *
 * BOOKING
 *   LOCAL-01 : LocalServicePage "Réserver maintenant" → dialog (SubService local)
 *
 * PROVIDER
 *   PROVIDER-01 : /nous-recrutons → formulaire de candidature visible
 *
 * CUSTOM
 *   CUSTOM-01 : /custom-request → formulaire demande sur-mesure visible
 *
 * CART
 *   CART-01   : /panier se charge sans crash
 *   CART-02   : /payment-canceled → bouton "Retour au panier" visible
 */

import { test, expect } from '@playwright/test';

// ─── AUTH ────────────────────────────────────────────────────────────────────

test.describe('AUTH — Flux d\'authentification', () => {

  test('AUTH-01 : /auth affiche le choix Client / Prestataire', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByText(/Je suis Client/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Je suis Prestataire/i)).toBeVisible();
  });

  test('AUTH-02 : clic "Je suis Client" → formulaire connexion visible', async ({ page }) => {
    await page.goto('/auth');
    await page.getByText(/Je suis Client/i).first().click();
    // Champ email et bouton "Se connecter" (type submit)
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();
  });

  test('AUTH-03 : login form → toggle "S\'inscrire" → formulaire client inscription visible', async ({ page }) => {
    await page.goto('/auth');
    await page.getByText(/Je suis Client/i).first().click();
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    // Basculer vers le formulaire d'inscription
    await page.getByRole('button', { name: /^S'inscrire$/i }).click();
    // ClientSignupForm a le bouton "Créer mon compte client" (≠ SecureAuthForm en mode signup)
    await expect(page.getByRole('button', { name: /Créer mon compte client/i })).toBeVisible({ timeout: 5000 });
  });

  test('AUTH-04 : login form → "Mot de passe oublié ?" → /reset-password', async ({ page }) => {
    await page.goto('/auth');
    await page.getByText(/Je suis Client/i).first().click();
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    await page.getByText(/Mot de passe oublié/i).click();
    await expect(page).toHaveURL(/\/reset-password/, { timeout: 5000 });
  });

});

// ─── NAVIGATION ──────────────────────────────────────────────────────────────

test.describe('NAVIGATION — Liens menu & hero', () => {

  test('NAV-01 : NewHero CTA "Réserver maintenant" → /services', async ({ page }) => {
    await page.goto('/');
    // NewHero (utilisé sur Index.tsx) a "🛒 Réserver maintenant" et non "Déléguer mes missions"
    const heroLink = page.getByRole('link', { name: /Réserver maintenant/i }).first();
    await expect(heroLink).toBeVisible({ timeout: 8000 });
    await heroLink.click();
    await expect(page).toHaveURL(/\/services/, { timeout: 5000 });
  });

  test('NAV-02 : Navbar "Connexion" → /auth', async ({ page }) => {
    await page.goto('/');
    // Le bouton connexion dans la navbar
    const loginLink = page.getByRole('link', { name: /^Connexion$/i });
    await expect(loginLink.first()).toBeVisible({ timeout: 5000 });
    await loginLink.first().click();
    await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
  });

  test('NAV-03 : NewHero CTA "Devenir prestataire" → /nous-recrutons', async ({ page }) => {
    await page.goto('/');
    // Le lien Navbar "Nous Recrutons" est hidden 2xl:block (invisible à <1536px).
    // On utilise le CTA "💼 Devenir prestataire" du NewHero qui est toujours visible.
    const link = page.getByRole('link', { name: /Devenir prestataire/i }).first();
    await expect(link).toBeVisible({ timeout: 8000 });
    await link.click();
    await expect(page).toHaveURL(/\/nous-recrutons/, { timeout: 5000 });
  });

  test('FOOTER-01 : Footer "CGU" → /cgu', async ({ page }) => {
    await page.goto('/');
    // Scroll jusqu'au footer pour forcer le rendu des liens
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const cguLink = page.locator('footer').getByRole('link', { name: /CGU/i }).first();
    await expect(cguLink).toBeVisible({ timeout: 8000 });
    await cguLink.click();
    await expect(page).toHaveURL(/\/cgu/, { timeout: 5000 });
  });

  test('FOOTER-02 : Footer "Mentions légales" → /mentions-legales', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: /mentions légales/i });
    await expect(link).toBeVisible({ timeout: 8000 });
    await link.click();
    await expect(page).toHaveURL(/\/mentions-legales/, { timeout: 5000 });
  });

});

// ─── BOOKING — LocalServicePage ───────────────────────────────────────────────

test.describe('BOOKING — LocalServicePage', () => {

  test('LOCAL-01 : /services/menage-repassage/paris → "Réserver maintenant" → dialog', async ({ page }) => {
    await page.goto('/services/menage-repassage/paris');
    // La page doit charger sans redirect (service + ville valides)
    await expect(page).not.toHaveURL(/\/services$/, { timeout: 5000 });
    const reserveBtn = page.getByRole('button', { name: /Réserver maintenant/i }).first();
    await expect(reserveBtn).toBeVisible({ timeout: 8000 });
    await reserveBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  });

});

// ─── PROVIDER ────────────────────────────────────────────────────────────────

test.describe('PROVIDER — Formulaire candidature', () => {

  test('PROVIDER-01 : /nous-recrutons charge le formulaire de candidature', async ({ page }) => {
    await page.goto('/nous-recrutons');
    // La page doit afficher un formulaire de candidature
    await expect(page.locator('form, [role="form"]').first()).toBeVisible({ timeout: 8000 });
  });

});

// ─── CUSTOM REQUEST ───────────────────────────────────────────────────────────

test.describe('CUSTOM — Demande sur-mesure', () => {

  test('CUSTOM-01 : /custom-request charge le formulaire de demande', async ({ page }) => {
    await page.goto('/custom-request');
    await expect(page.locator('form, [role="form"], textarea').first()).toBeVisible({ timeout: 8000 });
  });

});

// ─── CART ─────────────────────────────────────────────────────────────────────

test.describe('CART — Panier', () => {

  test('CART-01 : /panier se charge sans crash React', async ({ page }) => {
    await page.goto('/panier');
    // Pas d'erreur React non attrapée — vérifier qu'il n'y a pas de message d'erreur
    await expect(page.locator('body')).not.toContainText('Something went wrong', { timeout: 5000 });
    // La page doit avoir du contenu — utiliser main seul (évite strict-mode sur h1+h2+main)
    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('CART-02 : /payment-canceled → "Retour au panier" visible', async ({ page }) => {
    await page.goto('/payment-canceled');
    await expect(page.getByRole('button', { name: /Retour.*panier/i })).toBeVisible({ timeout: 5000 });
  });

});
