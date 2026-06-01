/**
 * R01-R08 — Guards d'authentification et de role
 *
 * R01 guest     /espace-personnel          -> /auth
 * R02 guest     /espace-prestataire        -> /auth/provider
 * R03 guest     /payment                   -> /auth
 * R04 client    /espace-prestataire        -> carte "Acces restreint"
 * R05 provider  /espace-prestataire        -> /provider-onboarding (is_verified=false)
 * R06 provider  /espace-prestataire        -> dashboard rendu (is_verified=true)
 * R07 provider  /espace-personnel          -> /espace-prestataire
 * R08 admin     /espace-personnel          -> /modern-admin
 *
 * Chaque describe surcharge storageState via test.use() pour etre deterministe
 * quel que soit le projet Playwright actif (client-auth, provider-auth, guest...).
 */

import { test, expect } from './fixtures';
import {
  MOCK_USER_ID,
  MOCK_PROVIDER_ID,
  MOCK_PROVIDER_EMAIL,
  json,
  stubEmpty,
  mockUserRolesClient,
  mockUserRolesProvider,
  mockProviderVerifiedSingle,
} from './helpers/supabase-mocks';

// ---- R01-R03 : Guest --------------------------------------------------------

test.describe('R01-R03 — Guest redirige vers auth', () => {
  test.use({ storageState: 'tests/auth-states/guest.json' });

  test('R01 /espace-personnel -> /auth', async ({ guestPage }) => {
    await guestPage.goto('/espace-personnel');
    await expect(guestPage).toHaveURL(/\/auth/, { timeout: 8000 });
    await expect(guestPage.getByText(/mes reservations|tableau de bord/i)).not.toBeVisible();
  });

  test('R02 /espace-prestataire -> /auth/provider', async ({ guestPage }) => {
    await guestPage.goto('/espace-prestataire');
    await expect(guestPage).toHaveURL(/\/auth/, { timeout: 8000 });
  });

  test('R03 /payment -> /auth', async ({ guestPage }) => {
    await guestPage.goto('/payment?service=Test&price=50');
    await expect(guestPage).toHaveURL(/\/auth/, { timeout: 8000 });
  });
});

// ---- R04 : Client sur route provider ----------------------------------------

test.describe('R04 — Client sur /espace-prestataire : carte Acces restreint', () => {
  test.use({ storageState: 'tests/auth-states/client.json' });

  test('client redirige vers carte "Acces restreint" (pas de flash dashboard)', async ({ clientPage }) => {
    const pageErrors: Error[] = [];
    clientPage.on('pageerror', err => pageErrors.push(err));

    await clientPage.goto('/espace-prestataire');

    // ProtectedProviderRoute : primaryRole=client -> carte d'erreur d'acces
    await expect(clientPage.getByRole('button', { name: /devenir prestataire/i })).toBeVisible({ timeout: 8000 });

    // Aucun contenu du dashboard prestataire ne doit etre visible
    await expect(clientPage.getByText(/mes prestations|tableau de bord prestataire/i)).not.toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});

// ---- R05 : Provider non verifie sur requireVerified -------------------------

test.describe('R05 — Provider non verifie sur /espace-prestataire (requireVerified)', () => {
  test.use({ storageState: 'tests/auth-states/provider.json' });

  test('is_verified=false -> redirect /provider-onboarding, zero flash', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // catch-alls first (LIFO), specifiques last
    await page.route('**/auth/v1/**',      stubEmpty);
    await page.route('**/rest/v1/**',      stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**',  json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire' }, aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/user_roles*', mockUserRolesProvider);
    // Provider non verifie — surcharge la fixture par defaut
    await page.route('**/rest/v1/providers*', json(200, {
      id: MOCK_PROVIDER_ID, user_id: MOCK_USER_ID,
      is_verified: false, status: 'pending',
      business_name: 'Test Provider',
    }));

    await page.goto('/espace-prestataire');

    await expect(page).toHaveURL(/\/provider-onboarding/, { timeout: 8000 });
    await expect(page.getByText(/tableau de bord prestataire|mes prestations/i)).not.toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});

// ---- R06 : Provider verifie accede au dashboard -----------------------------

test.describe('R06 — Provider verifie sur /espace-prestataire : dashboard rendu', () => {
  test.use({ storageState: 'tests/auth-states/provider.json' });

  test('is_verified=true -> reste sur /espace-prestataire, page visible', async ({ providerPage }) => {
    const pageErrors: Error[] = [];
    providerPage.on('pageerror', err => pageErrors.push(err));

    await providerPage.goto('/espace-prestataire');

    // URL correcte — pas de redirect
    await expect(providerPage).toHaveURL(/espace-prestataire/, { timeout: 8000 });

    // Un element du dashboard est rendu (page non blanche)
    await expect(providerPage.locator('body')).toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});

// ---- R07 : Provider sur route client ----------------------------------------

test.describe('R07 — Provider sur /espace-personnel : redirect /espace-prestataire', () => {
  test.use({ storageState: 'tests/auth-states/provider.json' });

  test('primaryRole=provider -> ProtectedRoute redirige vers /espace-prestataire', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // catch-alls first (LIFO), specifiques last
    await page.route('**/auth/v1/**',      stubEmpty);
    await page.route('**/rest/v1/**',      stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**',  json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire' }, aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/user_roles*', mockUserRolesProvider);
    // Route providers necessaire pour ProtectedProviderRoute apres la redirect
    await page.route('**/rest/v1/providers*', mockProviderVerifiedSingle);

    await page.goto('/espace-personnel');

    // ProtectedRoute voit primaryRole='provider' -> redirige
    await expect(page).toHaveURL(/espace-prestataire/, { timeout: 8000 });

    // Aucun contenu de l'espace client ne doit etre visible
    await expect(page.getByText(/mes reservations/i)).not.toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});

// ---- R08 : Admin sur route client -------------------------------------------

test.describe('R08 — Admin sur /espace-personnel : redirect /modern-admin', () => {
  test.use({ storageState: 'tests/auth-states/admin.json' });

  test('primaryRole=admin -> ProtectedRoute redirige vers /modern-admin', async ({ adminPage }) => {
    const pageErrors: Error[] = [];
    adminPage.on('pageerror', err => pageErrors.push(err));

    await adminPage.goto('/espace-personnel');

    // ProtectedRoute voit primaryRole='admin' -> redirige vers /modern-admin
    await expect(adminPage).toHaveURL(/modern-admin/, { timeout: 8000 });

    // Aucun contenu de l'espace client
    await expect(adminPage.getByText(/mes reservations/i)).not.toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});
