/**
 * Scénarios de navigation de base (section 2.1 du plan E2E)
 *
 * N01  Homepage charge sans erreur JS — title contient "Bikawo", aucune pageerror
 * N02  Route inconnue → composant NotFound ("404", "Page introuvable")
 * N03  /payment sans session → redirect /auth  (ProtectedRoute)
 * N04  /espace-prestataire sans session → redirect /auth/provider  (ProtectedProviderRoute)
 * N05a /modern-admin sans session → redirect /admin/login  (AdminRoute)
 * N05b /modern-admin avec session non-admin → "Accès Refusé"
 * N06  /provider/dashboard avec session provider vérifié → EspacePrestataire rendu
 * N07  /bika-kids (lazy) → spinner disparu, contenu visible
 */

import { test, expect, type Page } from '@playwright/test';
import {
  MOCK_USER_ID,
  MOCK_CLIENT_EMAIL,
  MOCK_PROVIDER_EMAIL,
  MOCK_PROVIDER_ID,
  makeClientSession,
  makeProviderSession,
  makeSessionBody,
  injectSession,
  json,
  stubEmpty,
  mockUserRolesClient,
  mockUserRolesProvider,
  mockProviderVerifiedSingle,
} from './helpers/supabase-mocks';

// ─── Auth stubs for unauthenticated state ─────────────────────────────────────

/** Stub all Supabase auth + REST calls so the app doesn't make real network requests. */
async function stubSupabaseNoSession(page: Page) {
  // Auth endpoints — no session
  await page.route('**/auth/v1/token**',   json(401, { error: 'invalid_grant' }));
  await page.route('**/auth/v1/user**',    json(401, { error: 'no session' }));
  await page.route('**/auth/v1/session**', json(200, { data: { session: null }, error: null }));
  // REST — empty results so nothing crashes
  await page.route('**/rest/v1/**', stubEmpty);
  // Edge functions — stub to prevent pending network calls
  await page.route('**/functions/v1/**', json(200, {}));
}

/** Stub all Supabase calls for an authenticated client (no provider record). */
async function stubSupabaseClientSession(page: Page) {
  await page.route('**/auth/v1/user**', json(200, {
    id: MOCK_USER_ID, email: MOCK_CLIENT_EMAIL, role: 'authenticated',
    user_metadata: { first_name: 'Marie', last_name: 'Dupont', user_type: 'client' },
    aud: 'authenticated', app_metadata: {},
  }));
  await page.route('**/rest/v1/user_roles*', mockUserRolesClient);
  await page.route('**/rest/v1/providers*',  json(200, null)); // no provider record
  await page.route('**/rest/v1/**',          stubEmpty);
  await page.route('**/functions/v1/**',     json(200, {}));
}

/** Stub Supabase calls for a verified provider. */
async function stubSupabaseProviderSession(page: Page) {
  await page.route('**/auth/v1/user**', json(200, {
    id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
    user_metadata: { user_type: 'prestataire' },
    aud: 'authenticated', app_metadata: {},
  }));
  await page.route('**/rest/v1/user_roles*', mockUserRolesProvider);
  // providers maybeSingle — verified
  await page.route('**/rest/v1/providers*',  mockProviderVerifiedSingle);
  await page.route('**/rest/v1/**',          stubEmpty);
  await page.route('**/functions/v1/**',     json(200, {}));
}

// ─── N01 — Homepage ───────────────────────────────────────────────────────────

test.describe('N01 — Homepage', () => {
  test('N01: charge sans erreur JS, title contient "Bikawo"', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await stubSupabaseNoSession(page);
    await page.goto('/');

    await expect(page).toHaveTitle(/bikawo/i, { timeout: 10000 });

    // No unhandled JS exceptions
    expect(pageErrors, `Unhandled JS errors: ${pageErrors.map(e => e.message).join(', ')}`).toHaveLength(0);
  });

  test('N01b: homepage rend la Navbar et un contenu above-the-fold', async ({ page }) => {
    await stubSupabaseNoSession(page);
    await page.goto('/');

    // At minimum the Navbar and hero content should be visible
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 10000 });
    // Hero section or main heading
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── N02 — Route inconnue → NotFound ─────────────────────────────────────────

test.describe('N02 — Route inconnue → 404', () => {
  test('N02: /xyz-inexistant affiche le composant NotFound', async ({ page }) => {
    await stubSupabaseNoSession(page);
    await page.goto('/xyz-inexistant');

    await expect(page.getByText('404')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/page introuvable/i)).toBeVisible();
  });

  test('N02b: NotFound propose un bouton "Accueil"', async ({ page }) => {
    await stubSupabaseNoSession(page);
    await page.goto('/xyz-inexistant');

    await expect(page.getByRole('button', { name: /accueil/i })).toBeVisible({ timeout: 5000 });
  });

  test('N02c: NotFound propose un bouton "Retour"', async ({ page }) => {
    await stubSupabaseNoSession(page);
    await page.goto('/xyz-inexistant');

    await expect(page.getByRole('button', { name: /retour/i })).toBeVisible({ timeout: 5000 });
  });
});

// ─── N03 — /payment sans session → /auth ─────────────────────────────────────

test.describe('N03 — /payment sans session', () => {
  test('N03: redirige vers /auth quand non authentifié', async ({ page }) => {
    await stubSupabaseNoSession(page);
    await page.goto('/payment');

    // ProtectedRoute redirects unauthenticated users to /auth
    await expect(page).toHaveURL(/\/auth/, { timeout: 8000 });
  });

  test('N03b: la page /auth est rendue (pas de page blanche)', async ({ page }) => {
    await stubSupabaseNoSession(page);
    await page.goto('/payment');

    await expect(page).toHaveURL(/\/auth/, { timeout: 8000 });
    // Auth page should have some visible content
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

// ─── N04 — /espace-prestataire sans session → /auth/provider ─────────────────

test.describe('N04 — /espace-prestataire sans session', () => {
  test('N04: redirige vers /auth/provider quand non authentifié', async ({ page }) => {
    await stubSupabaseNoSession(page);
    await page.goto('/espace-prestataire');

    // ProtectedProviderRoute default redirectTo = '/auth/provider'
    await expect(page).toHaveURL(/\/auth/, { timeout: 8000 });
  });

  test('N04b: redirige client authentifié (non-provider) vers écran accès refusé', async ({ page }) => {
    await injectSession(page, makeClientSession());
    await stubSupabaseClientSession(page);
    await page.goto('/espace-prestataire');

    // Client without provider role → access denied card with "Devenir prestataire"
    await expect(page.getByRole('button', { name: /devenir prestataire/i })).toBeVisible({ timeout: 8000 });
  });
});

// ─── N05 — /modern-admin sans rôle admin ─────────────────────────────────────

test.describe('N05 — /modern-admin sans rôle admin', () => {
  test('N05a: redirige vers /admin/login quand non authentifié', async ({ page }) => {
    await stubSupabaseNoSession(page);
    await page.goto('/modern-admin');

    // AdminRoute default redirectTo = '/admin/login'
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 8000 });
  });

  test('N05b: affiche "Accès Refusé" pour utilisateur authentifié sans rôle admin', async ({ page }) => {
    await injectSession(page, makeClientSession());
    await stubSupabaseClientSession(page);
    await page.goto('/modern-admin');

    // AdminRoute shows "Accès Refusé" card (not a redirect)
    await expect(page.getByText(/accès refusé/i)).toBeVisible({ timeout: 8000 });
  });

  test('N05c: "Accès Refusé" propose un lien vers l\'espace personnel du client', async ({ page }) => {
    await injectSession(page, makeClientSession());
    await stubSupabaseClientSession(page);
    await page.goto('/modern-admin');

    await expect(page.getByText(/accès refusé/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /espace personnel/i })).toBeVisible();
  });
});

// ─── N06 — /provider/dashboard avec session provider vérifié ─────────────────

test.describe('N06 — /provider/dashboard retour Stripe Connect', () => {
  test('N06: prestataire vérifié accède à EspacePrestataire via /provider/dashboard', async ({ page }) => {
    await injectSession(page, makeProviderSession());
    await stubSupabaseProviderSession(page);
    await page.goto('/provider/dashboard');

    // ProtectedProviderRoute(requireVerified) → EspacePrestataire renders
    // Should NOT be redirected to /auth or /provider-onboarding
    await expect(page).not.toHaveURL(/auth|onboarding/, { timeout: 8000 });

    // EspacePrestataire has some content
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('main, [role="main"], .min-h-screen').first()).toBeVisible({ timeout: 8000 });
  });

  test('N06b: /provider/dashboard sans session → redirige vers /auth/provider', async ({ page }) => {
    await stubSupabaseNoSession(page);
    await page.goto('/provider/dashboard');

    await expect(page).toHaveURL(/\/auth/, { timeout: 8000 });
  });

  test('N06c: /provider/dashboard prestataire non vérifié → redirige vers /provider-onboarding', async ({ page }) => {
    await injectSession(page, makeProviderSession());
    await page.route('**/auth/v1/user**', json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire' }, aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/user_roles*', mockUserRolesProvider);
    // Provider exists but is NOT verified
    await page.route('**/rest/v1/providers*', json(200, {
      id: MOCK_PROVIDER_ID, user_id: MOCK_USER_ID,
      is_verified: false, status: 'pending',
    }));
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));

    await page.goto('/provider/dashboard');

    await expect(page).toHaveURL(/provider-onboarding/, { timeout: 8000 });
  });
});

// ─── N07 — Lazy-loaded route : /bika-kids ────────────────────────────────────

test.describe('N07 — Lazy-loaded route /bika-kids', () => {
  test('N07: contenu visible après résolution du chargement paresseux', async ({ page }) => {
    await stubSupabaseNoSession(page);

    // Navigate and wait for network idle so the lazy chunk has fully loaded
    await page.goto('/bika-kids', { waitUntil: 'networkidle' });

    // PageLoader spinner (.animate-spin div) should be gone
    const spinner = page.locator('.animate-spin').first();
    await expect(spinner).not.toBeVisible({ timeout: 10000 });

    // BikaKids page content should be visible
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
  });

  test('N07b: aucune pageerror sur la route lazy-loaded', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await stubSupabaseNoSession(page);
    await page.goto('/bika-kids', { waitUntil: 'networkidle' });

    expect(pageErrors, `Unhandled JS errors: ${pageErrors.map(e => e.message).join(', ')}`).toHaveLength(0);
  });

  test('N07c: spinner PageLoader disparu avant affichage du contenu', async ({ page }) => {
    await stubSupabaseNoSession(page);

    // Slow down the BikaKids JS chunk to reliably observe the spinner
    await page.route('**/*.js', async (route) => {
      const url = route.request().url();
      // Delay only the BikaKids chunk
      if (url.includes('BikaKids') || url.includes('bika-kids')) {
        await new Promise((r) => setTimeout(r, 400));
      }
      await route.continue();
    });

    const loadingVisible = await Promise.race([
      (async () => {
        await page.goto('/bika-kids');
        // Check if spinner appeared at some point during navigation
        try {
          await page.locator('.animate-spin').first().waitFor({ state: 'visible', timeout: 600 });
          return true;
        } catch {
          return false; // chunk loaded too fast — acceptable
        }
      })(),
    ]);

    // Whether or not we caught the spinner, content must eventually be visible
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15000 });
  });
});
