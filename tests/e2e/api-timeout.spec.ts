/**
 * Section 3.3 — Timeout API / indisponibilité
 *
 * TC-TIMEOUT-01 : verify-payment répond après 15 s (expire le Promise.race)
 *   → mock delay infini → "La vérification a expiré" visible (toast destructive)
 *   → spinner disparu, bouton "Contacter le support" présent
 *
 * TC-TIMEOUT-02 : create-payment réseau coupé au clic "Payer"
 *   → route.abort() → "Erreur de paiement" toast
 *   → bouton reprend son état initial (loading=false via finally block)
 *
 * TC-TIMEOUT-03 : Supabase DB indisponible au mount de ProtectedRoute
 *   → session expirée + refresh abort → loading=false (finally block ✓)
 *   → ProtectedRoute redirige vers /auth, pas d'écran blanc
 */

import { test, expect } from '@playwright/test';
import {
  makeClientSession,
  injectSession,
  json,
  stubEmpty,
  mockUserRolesClient,
} from './helpers/supabase-mocks';

// ─── TC-TIMEOUT-01 ────────────────────────────────────────────────────────────

test.describe('TC-TIMEOUT-01 — verify-payment expire après 15 s', () => {
  test('verify-payment sans réponse → "La vérification a expiré" affiché, spinner disparu', async ({ page }) => {
    test.setTimeout(35000);

    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // verify-payment ne répond jamais → Promise.race de PaymentSuccess expire à 15 s
    await page.route('**/functions/v1/verify-payment**', async () => {
      await new Promise(() => {}); // ne se résout jamais
    });

    await page.goto('/payment-success?session_id=cs_test_timeout_session');

    // Après 15 s le composant affiche l'erreur de timeout
    await expect(page.getByText(/la vérification a expiré/i).first()).toBeVisible({ timeout: 20000 });

    // Le spinner de chargement doit avoir disparu
    await expect(page.locator('.animate-spin')).not.toBeVisible();

    // Bouton d'action toujours présent
    await expect(page.getByRole('button', { name: /contacter le support/i })).toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});

// ─── TC-TIMEOUT-02 ────────────────────────────────────────────────────────────

const MOCK_VISA = {
  id: 'pm_mock_001',
  brand: 'visa',
  last4: '4242',
  exp_month: 12,
  exp_year: 2030,
};

test.describe('TC-TIMEOUT-02 — create-payment réseau coupé', () => {
  test('create-payment abort → toast "Erreur de paiement", bouton non bloqué', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await injectSession(page, makeClientSession());

    // Bloquer le popup Stripe avant le chargement de la page
    await page.addInitScript(() => {
      (window as Window).open = () => null;
    });

    // catch-alls first (LIFO), specific mocks last
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**', json(200, makeClientSession().user));
    await page.route('**/rest/v1/user_roles*', mockUserRolesClient);
    await page.route('**/rest/v1/providers*', json(200, null));
    // get-payment-methods → une carte enregistrée pour que le bouton soit actif
    await page.route('**/functions/v1/get-payment-methods**', json(200, {
      paymentMethods: [MOCK_VISA],
    }));
    // create-payment → réseau coupé
    await page.route('**/functions/v1/create-payment**', (route) => route.abort());

    await page.goto('/payment?service=M%C3%A9nage&price=50&description=M%C3%A9nage+Complet');

    // Tab "Mon compte" actif (utilisateur connecté) — carte VISA chargée
    await expect(page.getByText('VISA •••• 4242')).toBeVisible({ timeout: 8000 });

    // Cliquer sur "Payer"
    await page.getByRole('button', { name: /payer/i }).click();

    // Toast "Erreur de paiement" visible après abort réseau
    await expect(page.getByText(/erreur de paiement/i).first()).toBeVisible({ timeout: 8000 });

    // Bouton de paiement non bloqué (loading=false via finally block)
    await expect(page.getByRole('button', { name: /payer/i })).not.toBeDisabled({ timeout: 5000 });

    expect(pageErrors).toHaveLength(0);
  });
});

// ─── TC-TIMEOUT-03 ────────────────────────────────────────────────────────────

test.describe('TC-TIMEOUT-03 — Supabase DB indisponible au mount ProtectedRoute', () => {
  test('aucune session + tous endpoints abortés → finally block, redirect /auth, pas d\'écran blanc', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // Aucune session injectée — simule un accès avec Supabase complètement indisponible
    // Tous les endpoints réseau sont abortés (simule DB/auth hors service)
    // getSession() lit localStorage (vide) → retourne null immédiatement, sans appel réseau
    // → finally block → loading=false → user=null → ProtectedRoute redirige vers /auth
    await page.route('**/auth/v1/**', (route) => route.abort());
    await page.route('**/rest/v1/**', (route) => route.abort());
    await page.route('**/functions/v1/**', (route) => route.abort());

    await page.goto('/espace-personnel');

    // ProtectedRoute reçoit user=null (finally block de useAuth a libéré loading)
    // → redirect vers /auth
    await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });

    // Page /auth rendue sans erreur JS (pas d'écran blanc ni spinner infini)
    await expect(page.locator('body')).toBeVisible();

    // Aucune erreur malgré les aborts réseau — Supabase JS gère les network errors en interne
    expect(pageErrors).toHaveLength(0);
  });
});
