/**
 * Section 3.1 — Scénarios d'échec de paiement
 *
 * TC-PAY-FAIL-01 : Stripe cancel → /payment-canceled
 *   → bikawo-pending-booking intact en localStorage (bug potentiel : re-soumission)
 *   → aucun toast "Réservation confirmée"
 *
 * TC-PAY-FAIL-02 : verify-payment renvoie success: false
 *   → AlertCircle visible + message d'erreur + bouton "Contacter le support"
 *
 * TC-PAY-FAIL-03 : Double visite /payment-success avec même session_id
 *   → première visite : alreadyProcessed=false → "Paiement réussi !"
 *   → refresh : alreadyProcessed=true → "Réservation enregistrée" + toast adapté, sans erreur
 */

import { test, expect } from '@playwright/test';
import {
  MOCK_CLIENT_EMAIL,
  makeClientSession,
  injectSession,
  json,
  stubEmpty,
  mockUserRolesClient,
} from './helpers/supabase-mocks';

const SESSION_ID = 'cs_test_abc123xyz';
const INVALID_SESSION_ID = 'cs_invalide_xyz';

function makeVerifySuccess(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    clientAmount: 40,
    clientInfo: {
      firstName: 'Marie', lastName: 'Dupont',
      email: MOCK_CLIENT_EMAIL, phone: '0612345678',
      address: '12 rue de Paris, 75001 Paris',
    },
    services: [],
    bookingIds: ['aabbccdd-1122-3344-5566-778899aabbcc'],
    alreadyProcessed: false,
    urssafEnabled: false,
    ...overrides,
  };
}

// ─── TC-PAY-FAIL-01 ────────────────────────────────────────────────────────────

test.describe('TC-PAY-FAIL-01 — Stripe cancel → /payment-canceled', () => {
  test('bikawo-pending-booking reste présent après annulation Stripe', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await injectSession(page, makeClientSession());

    // Simule le panier en attente avant la navigation
    await page.addInitScript(() => {
      localStorage.setItem('bikawo-pending-booking', JSON.stringify({
        clientInfo: { firstName: 'Marie', lastName: 'Dupont' },
        items: [{ serviceId: 'svc_001', quantity: 1, price: 40 }],
      }));
    });

    // Catch-alls first (LIFO), specific mocks last
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**', json(200, makeClientSession().user));
    await page.route('**/rest/v1/user_roles*', mockUserRolesClient);

    await page.goto('/payment-canceled');

    // Page rendue correctement
    await expect(page.getByRole('heading', { name: /paiement annulé/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /retour au panier/i })).toBeVisible();

    // BUG POTENTIEL : /payment-canceled ne nettoie pas bikawo-pending-booking
    // → si l'utilisateur relance un paiement, l'ancienne réservation peut être re-soumise
    const pending = await page.evaluate(() => localStorage.getItem('bikawo-pending-booking'));
    expect(pending).not.toBeNull();

    // Aucun toast de confirmation de réservation
    await expect(page.getByText(/réservation confirmée/i)).not.toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});

// ─── TC-PAY-FAIL-02 ────────────────────────────────────────────────────────────

test.describe('TC-PAY-FAIL-02 — verify-payment renvoie success: false', () => {
  test('session_id invalide → AlertCircle + erreur + bouton support', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.route('**/functions/v1/verify-payment**', json(200, {
      success: false,
      error: 'Session de paiement invalide ou expirée',
    }));

    await page.goto(`/payment-success?session_id=${INVALID_SESSION_ID}`);

    // Titre de l'état d'erreur
    await expect(page.getByText(/erreur de vérification/i)).toBeVisible({ timeout: 8000 });

    // Message d'erreur spécifique renvoyé par l'edge function (toast + <p> + aria-live → .first())
    await expect(page.getByText(/session de paiement invalide ou expirée/i).first()).toBeVisible();

    // Carte d'erreur avec bordure destructive — cible le <div> card, pas le toast <li>
    await expect(page.locator('div.border-destructive')).toBeVisible();

    // Bouton support présent
    await expect(page.getByRole('button', { name: /contacter le support/i })).toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});

// ─── TC-PAY-FAIL-03 ────────────────────────────────────────────────────────────

test.describe('TC-PAY-FAIL-03 — Double visite /payment-success même session_id', () => {
  test('première visite OK, refresh → alreadyProcessed=true sans erreur', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    let callCount = 0;
    await page.route('**/functions/v1/verify-payment**', (route) => {
      callCount++;
      const body = callCount === 1
        ? makeVerifySuccess({ alreadyProcessed: false })
        : makeVerifySuccess({ alreadyProcessed: true });
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });

    // Première visite
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);
    await expect(page.getByRole('heading', { name: /paiement réussi/i })).toBeVisible({ timeout: 8000 });

    // Deuxième visite (même session_id — simulé via re-navigation)
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);
    await expect(page.getByRole('heading', { name: /réservation enregistrée/i })).toBeVisible({ timeout: 8000 });

    // Sous-titre "Votre paiement a déjà été traité avec succès"
    await expect(page.getByText(/déjà été traité/i).first()).toBeVisible();

    // Pas de "Paiement réussi !" cette fois
    await expect(page.getByRole('heading', { name: /paiement réussi/i })).not.toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });

  test('alreadyProcessed=true → toast "déjà enregistrée", pas de toast erreur', async ({ page }) => {
    await page.route('**/functions/v1/verify-payment**', json(200, makeVerifySuccess({ alreadyProcessed: true })));

    await page.goto(`/payment-success?session_id=${SESSION_ID}`);
    await expect(page.getByRole('heading', { name: /réservation enregistrée/i })).toBeVisible({ timeout: 8000 });

    // Toast de confirmation (non destructif) avec message "déjà enregistrée" (toast + aria-live → .first())
    await expect(page.getByText(/votre réservation est déjà enregistrée/i).first()).toBeVisible({ timeout: 6000 });

    // Pas d'état d'erreur
    await expect(page.getByText(/erreur de vérification/i)).not.toBeVisible();
  });
});
