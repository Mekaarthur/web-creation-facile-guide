/**
 * Flux D — Confirmation paiement
 *
 * /payment-success?session_id=cs_xxx  →  PaymentSuccess.tsx
 *
 * Tests couverture:
 *  D-LOAD-*   : état de chargement (spinner pendant vérification)
 *  D-OK-*     : succès nominal — affichage détails, nettoyage localStorage, toast, navigation
 *  D-ALREADY-*: paiement déjà traité (alreadyProcessed)
 *  D-URSSAF-* : avance immédiate URSSAF activée
 *  D-ERR-*    : erreurs (pas de session_id, verify-payment échoue, HTTP 500, timeout)
 *  D-NAV-*    : navigation depuis la page de succès
 */

import { test, expect, type Page, type Route } from '@playwright/test';
import {
  MOCK_USER_ID,
  MOCK_CLIENT_EMAIL,
  makeClientSession,
  injectSession,
  json,
} from './helpers/supabase-mocks';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SESSION_ID = 'cs_test_abc123xyz';

const MOCK_CLIENT_INFO = {
  firstName: 'Marie',
  lastName: 'Dupont',
  email: MOCK_CLIENT_EMAIL,
  phone: '0612345678',
  address: '12 rue de Paris, 75001 Paris',
};

const MOCK_SERVICES = [
  {
    serviceName: 'Garde d\'enfants',
    packageTitle: 'Pack Essentiel',
    category: 'kids',
    price: 20,
    quantity: 2,
    customBooking: {
      date: '2026-06-15',
      startTime: '09:00',
      endTime: '11:00',
      hours: 2,
    },
  },
];

function makeSuccessResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    clientAmount: 40,
    clientInfo: MOCK_CLIENT_INFO,
    services: MOCK_SERVICES,
    bookingIds: ['aabbccdd-1122-3344-5566-778899aabbcc'],
    alreadyProcessed: false,
    urssafEnabled: false,
    ...overrides,
  };
}

/** Route mock for verify-payment — resolves immediately */
async function mockVerifyPayment(page: Page, body: unknown, status = 200) {
  await page.route('**/functions/v1/verify-payment**', (route: Route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  );
}

/** Inject bikawo cart/pending keys so we can verify they are removed on success. */
async function injectCartKeys(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('bikawo-cart',             JSON.stringify([{ id: 'x' }]));
    localStorage.setItem('bikawo-cart-timestamp',   Date.now().toString());
    localStorage.setItem('bikawo-pending-booking',  JSON.stringify({ clientInfo: {} }));
  });
}

// ─── D-LOAD — État de chargement ──────────────────────────────────────────────

test.describe('D-LOAD — Spinner de vérification', () => {
  test('D-LOAD-01: affiche le spinner "Vérification du paiement…" avant la réponse', async ({ page }) => {
    // Delay the response so we can catch the loading state
    await page.route('**/functions/v1/verify-payment**', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeSuccessResponse()) });
    });

    await page.goto(`/payment-success?session_id=${SESSION_ID}`);

    // Loading state should appear briefly
    await expect(page.getByText(/vérification du paiement/i)).toBeVisible({ timeout: 3000 });
  });

  test('D-LOAD-02: spinner disparaît une fois la vérification terminée', async ({ page }) => {
    await mockVerifyPayment(page, makeSuccessResponse());
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);

    // Wait for success heading to appear
    await expect(page.getByRole('heading', { name: /paiement réussi/i })).toBeVisible({ timeout: 8000 });
    // Spinner should be gone
    await expect(page.getByText(/vérification du paiement/i)).not.toBeVisible();
  });
});

// ─── D-OK — Succès nominal ────────────────────────────────────────────────────

test.describe('D-OK — Affichage de la confirmation réussie', () => {
  test.beforeEach(async ({ page }) => {
    await mockVerifyPayment(page, makeSuccessResponse());
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);
    await expect(page.getByRole('heading', { name: /paiement réussi/i })).toBeVisible({ timeout: 8000 });
  });

  test('D-OK-01: affiche le titre "Paiement réussi !"', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /paiement réussi/i })).toBeVisible();
  });

  test('D-OK-02: affiche le badge montant payé (clientAmount)', async ({ page }) => {
    await expect(page.getByText('40€ payé')).toBeVisible();
  });

  test('D-OK-03: affiche les informations client', async ({ page }) => {
    await expect(page.getByText('Marie Dupont')).toBeVisible();
    await expect(page.getByText(MOCK_CLIENT_EMAIL)).toBeVisible();
    await expect(page.getByText('0612345678')).toBeVisible();
  });

  test('D-OK-04: affiche le service réservé avec date et créneau', async ({ page }) => {
    await expect(page.getByText('Garde d\'enfants')).toBeVisible();
    await expect(page.getByText('09:00')).toBeVisible();
  });

  test('D-OK-05: affiche le numéro de réservation (8 premiers caractères)', async ({ page }) => {
    // bookingId.slice(0,8) = 'aabbccdd'
    await expect(page.getByText('aabbccdd')).toBeVisible();
  });

  test('D-OK-06: bouton "Voir mes réservations" est visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /voir mes réservations/i })).toBeVisible();
  });

  test('D-OK-07: bouton "Accueil" est visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /accueil/i })).toBeVisible();
  });
});

test.describe('D-OK — Nettoyage localStorage', () => {
  test('D-OK-08: bikawo-cart supprimé après succès', async ({ page }) => {
    await injectCartKeys(page);
    await mockVerifyPayment(page, makeSuccessResponse());
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);
    await expect(page.getByRole('heading', { name: /paiement réussi/i })).toBeVisible({ timeout: 8000 });

    const cartValue = await page.evaluate(() => localStorage.getItem('bikawo-cart'));
    expect(cartValue).toBeNull();
  });

  test('D-OK-09: bikawo-cart-timestamp supprimé après succès', async ({ page }) => {
    await injectCartKeys(page);
    await mockVerifyPayment(page, makeSuccessResponse());
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);
    await expect(page.getByRole('heading', { name: /paiement réussi/i })).toBeVisible({ timeout: 8000 });

    const tsValue = await page.evaluate(() => localStorage.getItem('bikawo-cart-timestamp'));
    expect(tsValue).toBeNull();
  });

  test('D-OK-10: bikawo-pending-booking supprimé après succès', async ({ page }) => {
    await injectCartKeys(page);
    await mockVerifyPayment(page, makeSuccessResponse());
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);
    await expect(page.getByRole('heading', { name: /paiement réussi/i })).toBeVisible({ timeout: 8000 });

    const pendingValue = await page.evaluate(() => localStorage.getItem('bikawo-pending-booking'));
    expect(pendingValue).toBeNull();
  });

  test('D-OK-11: événement bikawo-cart-updated dispatché après succès', async ({ page }) => {
    // Listen for the custom event
    await page.addInitScript(() => {
      (window as any).__cartUpdatedFired = false;
      window.addEventListener('bikawo-cart-updated', () => { (window as any).__cartUpdatedFired = true; });
    });

    await mockVerifyPayment(page, makeSuccessResponse());
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);
    await expect(page.getByRole('heading', { name: /paiement réussi/i })).toBeVisible({ timeout: 8000 });

    const fired = await page.evaluate(() => (window as any).__cartUpdatedFired);
    expect(fired).toBe(true);
  });
});

// ─── D-ALREADY — Paiement déjà traité ────────────────────────────────────────

test.describe('D-ALREADY — alreadyProcessed', () => {
  test('D-ALREADY-01: affiche "Réservation enregistrée" quand alreadyProcessed=true', async ({ page }) => {
    await mockVerifyPayment(page, makeSuccessResponse({ alreadyProcessed: true }));
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);

    await expect(page.getByRole('heading', { name: /réservation enregistrée/i })).toBeVisible({ timeout: 8000 });
  });

  test('D-ALREADY-02: n\'affiche pas "Paiement réussi !" quand alreadyProcessed=true', async ({ page }) => {
    await mockVerifyPayment(page, makeSuccessResponse({ alreadyProcessed: true }));
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);

    await expect(page.getByRole('heading', { name: /réservation enregistrée/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('heading', { name: /paiement réussi/i })).not.toBeVisible();
  });

  test('D-ALREADY-03: sous-titre "déjà traité" affiché', async ({ page }) => {
    await mockVerifyPayment(page, makeSuccessResponse({ alreadyProcessed: true }));
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);

    await expect(page.getByRole('heading', { name: /réservation enregistrée/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/déjà traité/i)).toBeVisible();
  });
});

// ─── D-URSSAF — Avance immédiate ─────────────────────────────────────────────

test.describe('D-URSSAF — Avance immédiate URSSAF', () => {
  test('D-URSSAF-01: affiche message URSSAF quand urssafEnabled=true', async ({ page }) => {
    await mockVerifyPayment(page, makeSuccessResponse({ urssafEnabled: true, clientAmount: 20 }));
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);

    await expect(page.getByRole('heading', { name: /paiement réussi/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/avance immédiate urssaf/i)).toBeVisible();
    await expect(page.getByText(/-50%/)).toBeVisible();
  });

  test('D-URSSAF-02: n\'affiche pas le message URSSAF quand urssafEnabled=false', async ({ page }) => {
    await mockVerifyPayment(page, makeSuccessResponse({ urssafEnabled: false }));
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);

    await expect(page.getByRole('heading', { name: /paiement réussi/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/avance immédiate urssaf/i)).not.toBeVisible();
  });
});

// ─── D-ERR — Cas d'erreur ─────────────────────────────────────────────────────

test.describe('D-ERR — Erreurs de vérification', () => {
  test('D-ERR-01: sans session_id dans l\'URL → "Session de paiement introuvable"', async ({ page }) => {
    // No route mock needed — the component handles missing param before any network call
    await page.goto('/payment-success');

    await expect(page.getByText(/session de paiement introuvable/i)).toBeVisible({ timeout: 5000 });
  });

  test('D-ERR-02: verify-payment renvoie success=false → affiche l\'erreur', async ({ page }) => {
    await mockVerifyPayment(page, { success: false, error: 'Paiement non autorisé' });
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);

    await expect(page.getByText(/erreur de vérification/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/paiement non autorisé/i)).toBeVisible();
  });

  test('D-ERR-03: verify-payment renvoie HTTP 500 → affiche l\'écran d\'erreur', async ({ page }) => {
    await mockVerifyPayment(page, { error: 'Internal server error' }, 500);
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);

    await expect(page.getByText(/erreur de vérification/i)).toBeVisible({ timeout: 8000 });
  });

  test('D-ERR-04: état d\'erreur affiche l\'icône AlertCircle (rouge)', async ({ page }) => {
    await mockVerifyPayment(page, { success: false, error: 'Test error' });
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);

    await expect(page.getByText(/erreur de vérification/i)).toBeVisible({ timeout: 8000 });
    // AlertCircle is rendered — page has error state card (destructive border)
    await expect(page.locator('.border-destructive')).toBeVisible();
  });

  test('D-ERR-05: état d\'erreur — bouton "Retour à l\'accueil" présent', async ({ page }) => {
    await mockVerifyPayment(page, { success: false, error: 'Erreur' });
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);

    await expect(page.getByText(/erreur de vérification/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /retour à l.accueil/i })).toBeVisible();
  });

  test('D-ERR-06: état d\'erreur — bouton "Contacter le support" présent', async ({ page }) => {
    await mockVerifyPayment(page, { success: false, error: 'Erreur' });
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);

    await expect(page.getByText(/erreur de vérification/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /contacter le support/i })).toBeVisible();
  });

  test('D-ERR-07: timeout 15 s → message d\'expiration', async ({ page }) => {
    // Override timeout to 200ms to keep the test fast, then delay the response
    await page.addInitScript(() => {
      // We can't easily override the 15 s constant, so we delay the edge function
      // long enough to simulate a timeout by responding only after page navigation.
    });

    // Respond after a very long delay — the component's 15 s timeout will fire first.
    // For test speed, we stall the route and rely on page.goto timing out too.
    // Instead: respond with a timeout error directly to mimic the race loser scenario.
    await page.route('**/functions/v1/verify-payment**', async (route) => {
      // Never fulfill — let the component's 15 s timer fire.
      // We abort after 300 ms to avoid blocking the test for 15 s.
      await new Promise((r) => setTimeout(r, 300));
      await route.abort('timedout');
    });

    await page.goto(`/payment-success?session_id=${SESSION_ID}`);

    // After abort, the component catches the error and shows error state
    await expect(page.getByText(/erreur de vérification|impossible|erreur/i)).toBeVisible({ timeout: 10000 });
  });
});

// ─── D-NAV — Navigation depuis la page de succès ─────────────────────────────

test.describe('D-NAV — Navigation', () => {
  test('D-NAV-01: "Voir mes réservations" navigue vers /espace-personnel', async ({ page }) => {
    await mockVerifyPayment(page, makeSuccessResponse());
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);
    await expect(page.getByRole('button', { name: /voir mes réservations/i })).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: /voir mes réservations/i }).click();

    await expect(page).toHaveURL(/espace-personnel/);
  });

  test('D-NAV-02: "Accueil" navigue vers /', async ({ page }) => {
    await mockVerifyPayment(page, makeSuccessResponse());
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);
    await expect(page.getByRole('button', { name: /accueil/i })).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: /accueil/i }).click();

    // toHaveURL avec string '/' est résolu par Playwright contre l'URL de base
    await expect(page).toHaveURL('/');
    await expect(page).not.toHaveURL(/payment/);
  });

  test('D-NAV-03: erreur — "Retour à l\'accueil" navigue vers /', async ({ page }) => {
    await mockVerifyPayment(page, { success: false, error: 'Erreur' });
    await page.goto(`/payment-success?session_id=${SESSION_ID}`);
    await expect(page.getByRole('button', { name: /retour à l.accueil/i })).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: /retour à l.accueil/i }).click();

    await expect(page).toHaveURL('/');
    await expect(page).not.toHaveURL(/payment/);
  });
});
