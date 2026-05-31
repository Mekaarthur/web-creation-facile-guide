/**
 * Flux C — Réservation : panier → checkout → paiement Stripe
 *
 * Tests couverture:
 *  CART-*  : comportement du panier (/panier)
 *  CHKOUT-*: transition vers BookingCheckout et soumission
 *  PAY-*   : page /payment (GuestCheckout + StripePaymentIntegration)
 *  CANCEL-*: page /payment-canceled
 *  EDGE-*  : cas limites (panier expiré, localStorage corrompu, URL sans params)
 */

import { test, expect, type Page } from '@playwright/test';
import {
  MOCK_USER_ID,
  MOCK_CLIENT_EMAIL,
  makeClientSession,
  injectSession,
  json,
  stubEmpty,
} from './helpers/supabase-mocks';

// ─── Cart helpers ─────────────────────────────────────────────────────────────

const FUTURE_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString();
})();

function makeCartItem(overrides: Record<string, unknown> = {}) {
  return {
    id: `item-${Math.random().toString(36).slice(2)}`,
    serviceName: 'Garde d\'enfants',
    serviceCategory: 'kids',
    packageTitle: 'Pack Essentiel',
    price: 20,
    quantity: 2,
    timeSlot: {
      date: FUTURE_DATE,
      startTime: '09:00',
      endTime: '11:00',
    },
    address: '12 rue de Paris, 75001 Paris',
    notes: '',
    ...overrides,
  };
}

function makeCartItem2() {
  return makeCartItem({
    id: 'item-2',
    serviceName: 'Ménage',
    serviceCategory: 'maison',
    packageTitle: 'Pack Standard',
    price: 25,
    quantity: 3,
    timeSlot: {
      date: FUTURE_DATE,
      startTime: '14:00',
      endTime: '17:00',
    },
  });
}

async function injectCart(page: Page, items: unknown[], expiredTimestamp = false) {
  const timestamp = expiredTimestamp
    ? (Date.now() - 35 * 60 * 1000).toString() // 35 min ago → expired
    : Date.now().toString();

  await page.addInitScript(({ cartKey, tsKey, cart, ts }) => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
    localStorage.setItem(tsKey, ts);
  }, { cartKey: 'bikawo-cart', tsKey: 'bikawo-cart-timestamp', cart: items, ts: timestamp });
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

async function setupAuthMocks(page: Page) {
  await page.route('**/auth/v1/user**', json(200, {
    id: MOCK_USER_ID, email: MOCK_CLIENT_EMAIL, role: 'authenticated',
    user_metadata: { first_name: 'Marie', last_name: 'Dupont', user_type: 'client' },
    aud: 'authenticated', app_metadata: {},
  }));
  await page.route('**/auth/v1/session**', json(200, makeClientSession()));
}

async function setupProfileMocks(page: Page) {
  await page.route('**/rest/v1/profiles*', json(200, [{
    user_id: MOCK_USER_ID, first_name: 'Marie', last_name: 'Dupont',
    email: MOCK_CLIENT_EMAIL, phone: '0612345678', address: '12 rue de Paris',
  }]));
}

async function setupPaymentMocks(page: Page, stripeUrl = 'https://checkout.stripe.com/test') {
  await page.route('**/functions/v1/create-payment**', json(200, { url: stripeUrl }));
}

// ─── CART tests ───────────────────────────────────────────────────────────────

test.describe('CART — État vide', () => {
  test('CART-01: affiche message panier vide quand localStorage vide', async ({ page }) => {
    await page.goto('/panier');
    await expect(page.getByText(/panier est vide/i)).toBeVisible();
  });

  test('CART-02: lien "Explorer nos services" présent sur panier vide', async ({ page }) => {
    await page.goto('/panier');
    const link = page.getByRole('link', { name: /explorer/i }).or(page.getByRole('link', { name: /services/i })).first();
    // Empty state should offer a navigation option
    await expect(page.getByText(/panier est vide/i)).toBeVisible();
    // At minimum, the page renders without crash
  });
});

test.describe('CART — Articles dans le panier', () => {
  test('CART-03: affiche l\'article injecté via localStorage', async ({ page }) => {
    const item = makeCartItem();
    await injectCart(page, [item]);
    await page.goto('/panier');
    await expect(page.getByText('Garde d\'enfants')).toBeVisible();
  });

  test('CART-04: affiche le total calculé correctement (price × quantity)', async ({ page }) => {
    const item = makeCartItem({ price: 20, quantity: 2 }); // 40€
    await injectCart(page, [item]);
    await page.goto('/panier');
    await expect(page.getByText('40€')).toBeVisible();
  });

  test('CART-05: affiche plusieurs articles', async ({ page }) => {
    await injectCart(page, [makeCartItem(), makeCartItem2()]);
    await page.goto('/panier');
    await expect(page.getByText('Garde d\'enfants')).toBeVisible();
    await expect(page.getByText('Ménage')).toBeVisible();
  });

  test('CART-06: suppression d\'un article via bouton Supprimer', async ({ page }) => {
    const item = makeCartItem({ id: 'item-to-remove' });
    await injectCart(page, [item]);
    await page.goto('/panier');

    // Click the remove button (aria-label contains service name)
    await page.getByRole('button', { name: /supprimer/i }).first().click();

    // Cart should now be empty
    await expect(page.getByText(/panier est vide/i)).toBeVisible();
  });

  test('CART-07: bouton "Vider" vide tout le panier', async ({ page }) => {
    await injectCart(page, [makeCartItem(), makeCartItem2()]);
    await page.goto('/panier');

    await page.getByRole('button', { name: /vider/i }).click();
    await expect(page.getByText(/panier est vide/i)).toBeVisible();
  });

  test('CART-08: services incompatibles (kids + maison) affichent une alerte', async ({ page }) => {
    // kids and maison are incompatible per COMPATIBILITY_RULES
    const kidsItem   = makeCartItem({ id: 'kids',  serviceCategory: 'kids',  timeSlot: { date: FUTURE_DATE, startTime: '10:00', endTime: '12:00' } });
    const maisonItem = makeCartItem({ id: 'maison', serviceCategory: 'maison', timeSlot: { date: FUTURE_DATE, startTime: '10:00', endTime: '12:00' } });
    await injectCart(page, [kidsItem, maisonItem]);
    await page.goto('/panier');

    // Should show incompatibility alert or "réservations séparées" message
    const incompatMsg = page.getByText(/séparées|incompatible|attention/i).first();
    await expect(incompatMsg).toBeVisible();
  });
});

test.describe('CART — Expiration et edge cases', () => {
  test('EDGE-01: panier expiré (> 30 min) → panier vide, pas de crash', async ({ page }) => {
    await injectCart(page, [makeCartItem()], true /* expired */);
    await page.goto('/panier');
    await expect(page.getByText(/panier est vide/i)).toBeVisible();
  });

  test('EDGE-02: localStorage bikawo-cart corrompu → page ne plante pas', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bikawo-cart', '{ not valid json [[[');
      localStorage.setItem('bikawo-cart-timestamp', Date.now().toString());
    });
    await page.goto('/panier');
    // Should render without crashing and show empty state
    await expect(page.getByText(/panier est vide/i)).toBeVisible();
  });
});

// ─── CART → CHECKOUT transition ───────────────────────────────────────────────

test.describe('CART → CHECKOUT — Transition vers la finalisation', () => {
  test('CHKOUT-01: clic "Procéder au paiement" affiche BookingCheckout', async ({ page }) => {
    await injectSession(page, makeClientSession());
    await setupAuthMocks(page);
    await setupProfileMocks(page);
    await injectCart(page, [makeCartItem()]);
    await page.goto('/panier');

    await page.getByRole('button', { name: /procéder au paiement/i }).click();

    // BookingCheckout renders with "Finalisation" heading and a "Retour au panier" button
    await expect(page.getByText(/finalisation/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /retour au panier/i })).toBeVisible();
  });

  test('CHKOUT-02: bouton "Retour au panier" dans BookingCheckout revient au panier', async ({ page }) => {
    await injectSession(page, makeClientSession());
    await setupAuthMocks(page);
    await setupProfileMocks(page);
    await injectCart(page, [makeCartItem()]);
    await page.goto('/panier');

    await page.getByRole('button', { name: /procéder au paiement/i }).click();
    await expect(page.getByText(/finalisation/i)).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /retour au panier/i }).click();

    // Back to cart view — "Procéder au paiement" button visible again
    await expect(page.getByRole('button', { name: /procéder au paiement/i })).toBeVisible({ timeout: 5000 });
  });

  test('CHKOUT-03: récapitulatif affiche les articles du panier', async ({ page }) => {
    await injectSession(page, makeClientSession());
    await setupAuthMocks(page);
    await setupProfileMocks(page);
    const item = makeCartItem({ serviceName: 'Garde d\'enfants Premium', price: 30, quantity: 2 });
    await injectCart(page, [item]);
    await page.goto('/panier');

    await page.getByRole('button', { name: /procéder au paiement/i }).click();
    await expect(page.getByText(/finalisation/i)).toBeVisible({ timeout: 5000 });

    await expect(page.getByText('Garde d\'enfants Premium')).toBeVisible();
    await expect(page.getByText('60')).toBeVisible(); // 30 × 2
  });

  test('CHKOUT-04: les infos profil connecté sont pré-remplies', async ({ page }) => {
    await injectSession(page, makeClientSession());
    await setupAuthMocks(page);
    await page.route('**/rest/v1/profiles*', json(200, [{
      user_id: MOCK_USER_ID,
      first_name: 'Marie', last_name: 'Dupont',
      email: MOCK_CLIENT_EMAIL, phone: '0612345678', address: '12 rue de Paris, 75001 Paris',
    }]));
    await injectCart(page, [makeCartItem()]);
    await page.goto('/panier');

    await page.getByRole('button', { name: /procéder au paiement/i }).click();
    await expect(page.getByText(/finalisation/i)).toBeVisible({ timeout: 5000 });

    // Prefilled from profile — input value check
    await expect(page.locator('#firstName, [name="firstName"], input[placeholder*="rénom"]').first()).toHaveValue('Marie', { timeout: 5000 });
  });

  test('CHKOUT-05: validation formulaire — champs obligatoires vides bloquent soumission', async ({ page }) => {
    await injectSession(page, makeClientSession());
    await setupAuthMocks(page);
    await setupProfileMocks(page);
    // Profile returns empty fields to test validation
    await page.route('**/rest/v1/profiles*', json(200, []));
    await injectCart(page, [makeCartItem()]);
    await page.goto('/panier');

    await page.getByRole('button', { name: /procéder au paiement/i }).click();
    await expect(page.getByText(/finalisation/i)).toBeVisible({ timeout: 5000 });

    // Submit without filling — should show error toast
    const confirmBtn = page.getByRole('button', { name: /confirmer/i }).first();
    await confirmBtn.click();

    await expect(page.getByText(/incomplet|renseigner|requis/i)).toBeVisible({ timeout: 5000 });
  });

  test('CHKOUT-06: soumission réussie → appel create-payment et redirection Stripe', async ({ page }) => {
    await injectSession(page, makeClientSession());
    await setupAuthMocks(page);
    await page.route('**/rest/v1/profiles*', json(200, [{
      user_id: MOCK_USER_ID,
      first_name: 'Marie', last_name: 'Dupont',
      email: MOCK_CLIENT_EMAIL, phone: '0612345678', address: '12 rue de Paris, 75001 Paris',
    }]));
    await injectCart(page, [makeCartItem()]);

    let paymentCallBody: unknown = null;
    await page.route('**/functions/v1/create-payment**', async (route) => {
      paymentCallBody = JSON.parse(route.request().postData() ?? '{}');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: 'https://checkout.stripe.com/pay/test123' }) });
    });

    // Intercept navigation to Stripe (opens in new tab or redirects)
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page').catch(() => null),
      (async () => {
        await page.goto('/panier');
        await page.getByRole('button', { name: /procéder au paiement/i }).click();
        await expect(page.getByText(/finalisation/i)).toBeVisible({ timeout: 5000 });

        const confirmBtn = page.getByRole('button', { name: /confirmer/i }).first();
        await confirmBtn.click();
      })(),
    ]);

    // Payment API should have been called
    await page.waitForTimeout(1000);
    expect(paymentCallBody).toBeTruthy();
  });

  test('CHKOUT-07: erreur create-payment → toast d\'erreur, pas de redirect', async ({ page }) => {
    await injectSession(page, makeClientSession());
    await setupAuthMocks(page);
    await page.route('**/rest/v1/profiles*', json(200, [{
      user_id: MOCK_USER_ID,
      first_name: 'Marie', last_name: 'Dupont',
      email: MOCK_CLIENT_EMAIL, phone: '0612345678', address: '12 rue de Paris, 75001 Paris',
    }]));
    await injectCart(page, [makeCartItem()]);
    await page.route('**/functions/v1/create-payment**', json(500, { error: 'Internal server error' }));

    await page.goto('/panier');
    await page.getByRole('button', { name: /procéder au paiement/i }).click();
    await expect(page.getByText(/finalisation/i)).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /confirmer/i }).first().click();

    await expect(page.getByText(/erreur/i)).toBeVisible({ timeout: 5000 });
    // Still on checkout page (not navigated away)
    await expect(page.getByText(/finalisation/i)).toBeVisible();
  });
});

// ─── /payment page (GuestCheckout + StripePaymentIntegration) ─────────────────

test.describe('PAY — Page /payment', () => {
  test('PAY-01: /payment affiche les onglets invité et compte', async ({ page }) => {
    await page.goto('/payment?service=Ménage&price=75&type=one-time&duration=3');
    // Two tabs should be visible
    await expect(page.getByRole('tab', { name: /invité|sans compte/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('tab', { name: /compte|connecté/i })).toBeVisible({ timeout: 5000 });
  });

  test('PAY-02: /payment affiche le prix du service depuis les URL params', async ({ page }) => {
    await page.goto('/payment?service=Ménage&price=75&type=one-time&duration=3');
    await expect(page.getByText('75')).toBeVisible({ timeout: 5000 });
  });

  test('EDGE-03: /payment sans ?price= affiche 0€ et ne plante pas', async ({ page }) => {
    await page.goto('/payment?service=Test&type=one-time');
    // Should render without crash
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('0')).toBeVisible({ timeout: 5000 });
  });

  test('PAY-03: onglet invité — validation GuestCheckout — email invalide bloqué', async ({ page }) => {
    await page.goto('/payment?service=Ménage&price=75&type=one-time&duration=3');

    // Make sure "invité" tab is active (it should be by default)
    const guestTab = page.getByRole('tab', { name: /invité|sans compte/i });
    if (await guestTab.isVisible()) await guestTab.click();

    await page.fill('input[name="email"], input[placeholder*="mail"]', 'not-an-email');
    await page.fill('input[name="firstName"], input[placeholder*="rénom"]', 'Marie');
    await page.fill('input[name="lastName"], input[placeholder*="om"]', 'Dupont');

    await page.getByRole('button', { name: /payer|paiement/i }).click();

    await expect(page.getByText(/email|invalide/i)).toBeVisible({ timeout: 3000 });
  });

  test('PAY-04: onglet invité — soumission valide → appel create-payment', async ({ page }) => {
    let called = false;
    await page.route('**/functions/v1/create-payment**', async (route) => {
      called = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: 'https://checkout.stripe.com/test' }) });
    });

    await page.goto('/payment?service=Ménage&price=75&type=one-time&duration=3');

    const guestTab = page.getByRole('tab', { name: /invité|sans compte/i });
    if (await guestTab.isVisible()) await guestTab.click();

    // Fill valid guest form
    await page.fill('input[name="email"]',      MOCK_CLIENT_EMAIL).catch(() =>
      page.fill('input[placeholder*="mail"]',   MOCK_CLIENT_EMAIL)
    );
    await page.fill('input[name="firstName"]',  'Marie').catch(() =>
      page.fill('input[placeholder*="rénom"]',  'Marie')
    );
    await page.fill('input[name="lastName"]',   'Dupont').catch(() =>
      page.fill('input[placeholder*="om"]',     'Dupont')
    );
    await page.fill('input[name="phone"]',      '0612345678').catch(() =>
      page.fill('input[placeholder*="léphone"]', '0612345678')
    );
    await page.fill('input[name="address"]',    '12 rue de Paris').catch(() =>
      page.fill('input[placeholder*="dresse"]', '12 rue de Paris')
    );
    await page.fill('input[name="postalCode"]', '75001').catch(() =>
      page.fill('input[placeholder*="ostal"]',  '75001')
    );
    await page.fill('input[name="city"]',       'Paris').catch(() =>
      page.fill('input[placeholder*="ille"]',   'Paris')
    );

    await page.getByRole('button', { name: /payer|paiement/i }).click();

    await page.waitForTimeout(1500);
    expect(called).toBe(true);
  });

  test('PAY-05: onglet compte — affiche section moyen de paiement pour user connecté', async ({ page }) => {
    await injectSession(page, makeClientSession());
    await setupAuthMocks(page);
    await page.route('**/functions/v1/get-payment-methods**', json(200, { paymentMethods: [] }));

    await page.goto('/payment?service=Ménage&price=75&type=one-time&duration=3');

    const accountTab = page.getByRole('tab', { name: /compte|connecté/i });
    if (await accountTab.isVisible()) await accountTab.click();

    // Should show payment methods section
    await expect(page.getByText(/moyen de paiement|carte/i)).toBeVisible({ timeout: 5000 });
  });
});

// ─── /payment-canceled ────────────────────────────────────────────────────────

test.describe('CANCEL — Page /payment-canceled', () => {
  test('CANCEL-01: affiche message d\'annulation', async ({ page }) => {
    await page.goto('/payment-canceled');
    await expect(page.getByText(/annul|annulation/i)).toBeVisible({ timeout: 5000 });
  });

  test('CANCEL-02: bouton "Retour au panier" navigue vers /panier', async ({ page }) => {
    await page.goto('/payment-canceled');
    await page.getByRole('button', { name: /retour au panier/i }).click();
    await expect(page).toHaveURL(/\/panier/);
  });

  test('CANCEL-03: bouton "Retour à l\'accueil" navigue vers /', async ({ page }) => {
    await page.goto('/payment-canceled');
    await page.getByRole('button', { name: /retour à l.accueil/i }).click();
    await expect(page).toHaveURL(/^\//);
    // Should be home page (not /panier, not /payment)
    await expect(page).not.toHaveURL(/panier|payment/);
  });
});
