/**
 * Scénarios de redirections et guards (section 2.3 du plan E2E)
 *
 * R01  ProtectedRoute → loading=true → spinner, puis redirect si non connecté
 * R02  ProtectedProviderRoute requireVerified → provider non vérifié → /provider-onboarding
 * R03  AdminRoute → rôle client → card "Accès Refusé" (pas de redirect brutal)
 * R04  Post-login avec ?redirect=payment → URL finale est /payment
 * R05  /auth/complete avec token valide → session activée, redirect /dashboard-client
 * R06  /email/verify/:token invalide → page d'erreur, pas de crash
 * R07  /admin/* → <Navigate replace> vers /modern-admin
 * R08  Stripe Cancel → /payment-canceled → page annulation rendue, pas d'edge function
 */

import { test, expect } from '@playwright/test';
import {
  MOCK_USER_ID,
  MOCK_CLIENT_EMAIL,
  MOCK_PROVIDER_EMAIL,
  makeClientSession,
  makeProviderSession,
  injectSession,
  json,
  stubEmpty,
  mockUserRolesClient,
  mockUserRolesProvider,
  mockProviderUnverifiedSingle,
} from './helpers/supabase-mocks';

// ─── R01 — ProtectedRoute → spinner puis redirect si non connecté ─────────────

test.describe('R01 — ProtectedRoute sans session', () => {
  test('R01: /payment sans session → redirect /auth', async ({ page }) => {
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));

    await page.goto('/payment');

    await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
  });

  test('R01b: contenu protégé jamais visible avant redirect (no flash)', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));

    await page.goto('/espace-personnel');

    await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
    // Dashboard content must never have been rendered past the guard
    await expect(page.getByText(/tableau de bord|mes réservations/i)).not.toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });
});

// ─── R02 — ProtectedProviderRoute requireVerified → /provider-onboarding ──────

test.describe('R02 — ProtectedProviderRoute non vérifié', () => {
  test('R02: provider is_verified=false sur /espace-prestataire → /provider-onboarding', async ({ page }) => {
    await injectSession(page, makeProviderSession());

    // catch-alls first (LIFO: checked last), specific mocks last (checked first)
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**', json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire' }, aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/user_roles*', mockUserRolesProvider);
    // providers maybeSingle → is_verified: false → triggers redirect
    await page.route('**/rest/v1/providers*', mockProviderUnverifiedSingle);

    await page.goto('/espace-prestataire');

    await expect(page).toHaveURL(/\/provider-onboarding/, { timeout: 8000 });
  });
});

// ─── R03 — AdminRoute → rôle client → card "Accès Refusé" ───────────────────

test.describe('R03 — AdminRoute avec rôle client', () => {
  test('R03: client sur /modern-admin → card "Accès Refusé", pas de redirect', async ({ page }) => {
    await injectSession(page, makeClientSession());

    // catch-alls first, specific mocks last (LIFO)
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**', json(200, {
      id: MOCK_USER_ID, email: MOCK_CLIENT_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'client' }, aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/user_roles*', mockUserRolesClient);

    await page.goto('/modern-admin');

    await expect(page.getByText(/Accès Refusé/i)).toBeVisible({ timeout: 8000 });
    // Client role → button to espace personnel
    await expect(page.getByRole('button', { name: /mon espace personnel/i })).toBeVisible();
    // Still at /modern-admin — access denied card shown in-place (no redirect)
    await expect(page).toHaveURL(/\/modern-admin/);
  });
});

// ─── R04 — Post-login avec ?redirect=payment → URL finale /payment ────────────

test.describe('R04 — Post-login ?redirect=payment', () => {
  test('R04: login depuis /auth?redirect=payment → URL finale /payment', async ({ page }) => {
    const clientSession = makeClientSession();

    // catch-alls first, specific mocks last (LIFO)
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/token*', json(200, clientSession));
    await page.route('**/auth/v1/user**', json(200, clientSession.user));
    await page.route('**/rest/v1/user_roles*', mockUserRolesClient);
    await page.route('**/rest/v1/providers*', json(200, null));

    await page.goto('/auth?redirect=payment');
    await page.getByRole('button').filter({ hasText: 'Je suis Client' }).click({ timeout: 10000 });
    await page.locator('input[name="email"]').fill(MOCK_CLIENT_EMAIL);
    await page.locator('input[name="password"]').fill('ValidPass@123');
    await page.getByRole('button', { name: /se connecter|connexion/i }).first().click();

    // SecureAuthForm reads ?redirect=payment → navigates to /payment (not /espace-personnel)
    await expect(page).toHaveURL(/\/payment/, { timeout: 10000 });
  });
});

// ─── R05 — /auth/complete avec token valide → session + redirect ──────────────

test.describe('R05 — /auth/complete token valide', () => {
  test('R05: access_token dans hash + session localStorage → "Email confirmé" puis /dashboard-client', async ({ page }) => {
    // Inject session so getSession() returns a valid user immediately
    await injectSession(page, makeClientSession());

    // catch-alls first, specific mocks last (LIFO)
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**', json(200, makeClientSession().user));
    await page.route('**/rest/v1/user_roles*', mockUserRolesClient);

    // Query param token — avoids Supabase's auto-processing of hash tokens
    await page.goto('/auth/complete?token=MOCK_TOKEN');

    // AuthComplete shows success state
    await expect(page.getByRole('heading', { name: /Email confirmé/i })).toBeVisible({ timeout: 5000 });

    // After 2500ms setTimeout → navigate('/dashboard-client')
    await expect(page).toHaveURL(/\/dashboard-client/, { timeout: 5000 });
  });
});

// ─── R06 — /email/verify/:token invalide → page erreur, pas de crash ─────────

test.describe('R06 — /email/verify/:token invalide', () => {
  test('R06: ?error=invalid_link → card "Erreur de confirmation", pas de crash', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));

    // AuthComplete reads searchParams.get('error') → setStatus('error') immediately
    await page.goto('/email/verify/invalid-token?error=invalid_link&error_description=Lien+expiré');

    await expect(page.getByText(/Erreur de confirmation/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Renvoyer le lien/i })).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });

  test('R06b: chemin seul sans token ni erreur → pas de crash JS', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));

    // No token in hash, no error → AuthComplete shows "Inscription réussie" (no-token path)
    await page.goto('/email/verify/some-expired-token');

    await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
    expect(pageErrors).toHaveLength(0);
  });
});

// ─── R07 — /admin/* → <Navigate replace> vers /modern-admin ──────────────────

test.describe('R07 — /admin/* → Navigate replace vers /modern-admin', () => {
  test('R07: /admin → <Navigate replace> déclenché, URL hors de /admin', async ({ page }) => {
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));

    await page.goto('/admin');

    // Navigate replace fires: /admin → /modern-admin, then AdminRoute (no auth) → /admin/login
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5000 });
    // Confirm we did NOT stay at /admin (Navigate component was effective)
    expect(page.url()).not.toMatch(/\/admin$/);
  });

  test('R07b: /admin/sous-page → wildcard <Navigate replace> vers /modern-admin', async ({ page }) => {
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));

    await page.goto('/admin/users');

    // /admin/* wildcard redirects to /modern-admin, then AdminRoute → /admin/login
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5000 });
  });
});

// ─── R08 — Stripe Cancel → /payment-canceled ─────────────────────────────────

test.describe('R08 — Stripe Cancel → /payment-canceled', () => {
  test('R08: page annulation rendue sans appel edge function', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    let edgeFunctionCalled = false;
    await page.route('**/functions/v1/**', (route) => {
      edgeFunctionCalled = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/auth/v1/**', stubEmpty);

    await page.goto('/payment-canceled');

    // Page renders correctly
    await expect(page.getByText(/Paiement annulé/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Retour au panier/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Retour à l.accueil/i })).toBeVisible();

    // No edge function called — purely static UI
    expect(edgeFunctionCalled).toBe(false);
    expect(pageErrors).toHaveLength(0);
  });
});
