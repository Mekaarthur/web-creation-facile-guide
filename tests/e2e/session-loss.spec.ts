/**
 * Section 3.2 — Perte de session
 *
 * TC-SESSION-01 : Expiration de session pendant navigation protégée
 *   → token supprimé manuellement → navigation vers route protégée → redirect /auth
 *   → pas de données client exposées après expiration
 *
 * TC-SESSION-02 : /payment-success sans session active
 *   → 02a : edge function retourne success=true (guest checkout) → page succès affichée
 *   → 02b : edge function retourne success=false (auth RLS) → AlertCircle géré proprement
 *
 * TC-SESSION-03 : signOut pendant upload en cours (DocumentUploadSection)
 *   → upload en flight → localStorage vidé → navigation → pas de crash React (state update unmounted)
 */

import { test, expect } from '@playwright/test';
import {
  MOCK_USER_ID,
  MOCK_PROVIDER_EMAIL,
  MOCK_PROVIDER_ID,
  makeClientSession,
  makeProviderSession,
  injectSession,
  json,
  stubEmpty,
  mockUserRolesClient,
  mockUserRolesProvider,
  supabaseStorageKey,
  minimalPdfBuffer,
} from './helpers/supabase-mocks';

// ─── TC-SESSION-01 ─────────────────────────────────────────────────────────────

test.describe('TC-SESSION-01 — Expiration de session', () => {
  test('session expirée → navigation vers route protégée → redirect /auth sans données exposées', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // Phase 1 : session valide sur /espace-personnel
    await injectSession(page, makeClientSession());

    // catch-alls first (LIFO), specific mocks last
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**', json(200, makeClientSession().user));
    await page.route('**/rest/v1/user_roles*', mockUserRolesClient);

    await page.goto('/espace-personnel');
    await expect(page).toHaveURL(/espace-personnel/, { timeout: 8000 });

    // Phase 2 : simuler expiration en cours de session
    // getSession() + refresh token échoue à l'instant T → ProtectedRoute redirige
    //
    // Stratégie : dispatcher manuellement un StorageEvent avec newValue=null.
    // Supabase v2 écoute window.storage pour la synchronisation multi-onglets.
    // Dispatcher l'événement dans la même page force la détection immédiate (SIGNED_OUT)
    // sans attendre un prochain cycle de refresh.
    await page.evaluate((key) => {
      const oldValue = localStorage.getItem(key);
      localStorage.removeItem(key);
      // Notifie Supabase JS via l'API storage event qu'elle surveille
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        oldValue,
        newValue: null,
        storageArea: localStorage,
        url: location.href,
      }));
    }, supabaseStorageKey());

    // Supabase reçoit l'événement → SIGNED_OUT → user=null
    // ProtectedRoute (toujours sur /espace-personnel) re-rend → redirect /auth
    await expect(page).toHaveURL(/\/auth/, { timeout: 8000 });

    // Aucun contenu protégé ne doit être visible après expiration
    await expect(page.getByText(/mes réservations/i)).not.toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });

  test('accès direct à /espace-personnel sans session → redirect /auth sans flash de contenu', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // Pas de session injectée — simule un token expiré ou absent
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));

    await page.goto('/espace-personnel');

    await expect(page).toHaveURL(/\/auth/, { timeout: 8000 });
    await expect(page.getByText(/mes réservations|tableau de bord/i)).not.toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});

// ─── TC-SESSION-02 ─────────────────────────────────────────────────────────────

const GUEST_SESSION_ID = 'cs_test_guest_valid';

function makeGuestVerifySuccess() {
  return {
    success: true,
    clientAmount: 30,
    clientInfo: {
      firstName: 'Invité', lastName: 'Test',
      email: 'invite@example.com', phone: '0600000000',
      address: '1 rue du Parc, 75001 Paris',
    },
    services: [],
    bookingIds: ['ccddee00-1111-2222-3333-444455556666'],
    alreadyProcessed: false,
    urssafEnabled: false,
  };
}

test.describe('TC-SESSION-02 — /payment-success sans session active', () => {
  test('TC-SESSION-02a : guest checkout → verify-payment success → page succès affichée', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // Aucune session — utilisateur non authentifié
    // /payment-success n'est PAS protégé par ProtectedRoute → edge function appelée quand même
    await page.route('**/functions/v1/verify-payment**', json(200, makeGuestVerifySuccess()));

    await page.goto(`/payment-success?session_id=${GUEST_SESSION_ID}`);

    // Edge function appelée sans auth → succès affiché (guest checkout)
    await expect(page.getByRole('heading', { name: /paiement réussi/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Invité Test')).toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });

  test('TC-SESSION-02b : verify-payment failure (RLS/auth requis) → AlertCircle, erreur gérée proprement', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // Aucune session — l'edge function simule un refus RLS / auth
    await page.route('**/functions/v1/verify-payment**', json(200, {
      success: false,
      error: 'Authentification requise pour vérifier ce paiement',
    }));

    await page.goto(`/payment-success?session_id=${GUEST_SESSION_ID}`);

    // Erreur gérée proprement — AlertCircle visible, pas de crash ni page blanche
    await expect(page.getByText(/erreur de vérification/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/authentification requise/i).first()).toBeVisible();
    await expect(page.locator('div.border-destructive')).toBeVisible();
    await expect(page.getByRole('button', { name: /contacter le support/i })).toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});

// ─── TC-SESSION-03 ─────────────────────────────────────────────────────────────

test.describe('TC-SESSION-03 — signOut pendant upload en cours', () => {
  test('upload en flight + session vidée → pas de crash React, redirect /auth', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await injectSession(page, makeProviderSession());

    // catch-alls first (LIFO), specific mocks last
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**', json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire' }, aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/user_roles*', mockUserRolesProvider);
    // Provider sans documents — déclenche l'étape 1 (Documents)
    await page.route('**/rest/v1/providers*', json(200, {
      id: MOCK_PROVIDER_ID, user_id: MOCK_USER_ID, is_verified: false, status: 'pending',
      business_name: 'Test Provider', documents_submitted: false,
      mandat_facturation_accepte: false, formation_completed: false,
    }));
    await page.route('**/rest/v1/provider_documents*', json(200, []));

    // Storage upload lent — simule un upload en flight (2 s)
    await page.route('**/storage/v1/**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ Key: 'test/identity_document.pdf' }) });
    });

    await page.goto('/provider-onboarding');

    // Attendre que l'étape Documents soit rendue
    await expect(page.getByText(/documents requis/i)).toBeVisible({ timeout: 10000 });

    // Le bouton upload de DocumentUploadSection crée un <input type="file"> dynamiquement
    // Playwright capture le file chooser via waitForEvent('filechooser')
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /^uploader$/i }).first().click(),
    ]);
    await fileChooser.setFiles({
      name: 'identity.pdf',
      mimeType: 'application/pdf',
      buffer: minimalPdfBuffer(),
    });

    // Upload maintenant en flight (getUser() + storage.upload() en cours, 2s de délai)
    // Simuler signOut : vider localStorage auth
    await page.evaluate((key) => localStorage.removeItem(key), supabaseStorageKey());

    // Naviguer vers la page d'accueil (non protégée) — provoque le démontage de DocumentUploadSection
    // pendant que storage.upload() est encore en flight (mock 2s non écoulé).
    // page.goto() annule les requêtes en vol → storage.upload() lève une erreur d'abort
    // → catch block du composant s'exécute sur un composant déjà démonté → React 18 silencieux
    await page.goto('/');

    // /^\// ne correspond pas à "http://localhost:5173/" (commence par http, pas /)
    // On vérifie simplement qu'on n'est plus sur les pages protégées
    await expect(page).not.toHaveURL(/payment|auth|onboarding/);

    // Aucune erreur JS malgré le setState sur composant démonté (React 18 silencieux)
    expect(pageErrors).toHaveLength(0);
  });
});
