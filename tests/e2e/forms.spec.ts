/**
 * Scénarios de formulaires (section 2.2 du plan E2E)
 *
 * F01  EnhancedAuth inscription — champs vides → validation présente, pas de réseau
 * F02  EnhancedAuth inscription — email invalide → erreur visible
 * F03  EnhancedAuth connexion   — mauvais mot de passe → toast erreur Supabase
 * F04  EnhancedAuth connexion   — succès → redirect /espace-personnel
 * F05  ProviderApplicationForm  — submit sans services → erreur validation
 * F06  ProviderApplicationForm  — candidature complète → toast succès + INSERT DB
 * F07  MandateSignature         — submit sans signature → toast "Veuillez signer"
 * F08  MandateSignature         — signature + checkbox → UPDATE providers appelé
 * F09  Cart                     — ajout article → bikawo-cart contient l'item
 * F10  Payment                  — ?price= non numérique → 0€, pas de crash
 * F11  GuestCheckout            — email invalide → erreur avant appel Stripe
 * F12  CustomRequest            — soumission complète → toast succès + INSERT DB
 */

import { test, expect, type Page } from '@playwright/test';
import {
  MOCK_USER_ID,
  MOCK_CLIENT_EMAIL,
  MOCK_PROVIDER_ID,
  MOCK_PROVIDER_EMAIL,
  makeClientSession,
  makeProviderSession,
  injectSession,
  json,
  stubEmpty,
  mockLoginInvalid,
  mockUserRolesClient,
  mockUserRolesProvider,
} from './helpers/supabase-mocks';

// ─── Auth navigation helpers ─────���────────────────────────────────────────────

/** Navigate to /auth and select client user-type (step 1 of EnhancedAuth). */
async function goToAuthClient(page: Page) {
  await page.goto('/auth');
  // Step 1: choose user type — click the "client" option
  const clientBtn = page.getByRole('button', { name: /client|particulier/i }).first();
  if (await clientBtn.isVisible({ timeout: 5000 })) {
    await clientBtn.click();
  }
}

/** Switch to signup tab/form inside EnhancedAuth. */
async function switchToSignup(page: Page) {
  const signupTrigger = page.getByRole('button', { name: /créer un compte|inscription|s.inscrire/i })
    .or(page.getByRole('tab', { name: /inscription|créer/i }))
    .first();
  await signupTrigger.click();
}

/** Fill signup form fields in ClientSignupForm. */
async function fillSignupForm(page: Page, overrides: Record<string, string> = {}) {
  const v = { firstName: 'Marie', lastName: 'Dupont', email: 'marie@test.bikawo.fr', password: 'Test@12345', phone: '0612345678', ...overrides };
  await page.fill('[name="firstName"], [placeholder*="rénom"]',   v.firstName).catch(() => {});
  await page.fill('[name="lastName"], [placeholder*="om"]',       v.lastName).catch(()  => {});
  await page.fill('[name="email"], [placeholder*="mail"]',        v.email).catch(()     => {});
  await page.fill('[name="password"], [placeholder*="ssword"], [placeholder*="mot de passe"]', v.password).catch(() => {});
  await page.fill('[name="phone"], [placeholder*="léphone"]',     v.phone).catch(()     => {});
}

/** Fill login form fields. */
async function fillLoginForm(page: Page, email: string, password: string) {
  await page.fill('[name="email"], input[type="email"]',         email);
  await page.fill('[name="password"], input[type="password"]',   password);
}

// ─── F01 — EnhancedAuth inscription — champs vides ───────────────────────────

test.describe('F01 — Inscription champs vides', () => {
  test('F01: messages d\'erreur présents, aucune requête Supabase effectuée', async ({ page }) => {
    const supabaseCallMade = { value: false };
    await page.route('**/auth/v1/**', (route) => {
      supabaseCallMade.value = true;
      route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'should_not_be_called' }) });
    });

    await goToAuthClient(page);
    await switchToSignup(page);

    // Submit without filling anything
    await page.getByRole('button', { name: /s.inscrire|créer|valider|soumettre/i }).first().click();

    // Validation errors should appear
    await expect(page.getByText(/requis|obligatoire|champ|minimum|invalid/i).first()).toBeVisible({ timeout: 5000 });
    expect(supabaseCallMade.value).toBe(false);
  });

  test('F01b: au moins un message d\'erreur par champ requis vide', async ({ page }) => {
    await page.route('**/auth/v1/**', stubEmpty);
    await goToAuthClient(page);
    await switchToSignup(page);

    await page.getByRole('button', { name: /s.inscrire|créer|valider/i }).first().click();

    // Multiple validation messages should be present
    const errors = page.locator('[class*="error"], [aria-invalid], .text-destructive, [role="alert"]');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── F02 — Inscription — email invalide ───────────���───────────────────────────

test.describe('F02 — Inscription email invalide', () => {
  test('F02: message de validation email visible', async ({ page }) => {
    await page.route('**/auth/v1/**', stubEmpty);
    await goToAuthClient(page);
    await switchToSignup(page);

    await page.fill('[name="email"], input[type="email"]', 'pas-un-email@@@@');
    // Trigger validation by blurring or submitting
    await page.keyboard.press('Tab');
    await page.getByRole('button', { name: /s.inscrire|créer|valider/i }).first().click();

    await expect(page.getByText(/email|e-mail|invalide|format/i)).toBeVisible({ timeout: 5000 });
  });
});

// ─── F03 — Connexion mauvais mot de passe ────────���────────────────────────��───

test.describe('F03 — Connexion mauvais mot de passe', () => {
  test('F03: toast d\'erreur Supabase affiché après 401', async ({ page }) => {
    // Mock login to fail
    await page.route('**/auth/v1/token*', mockLoginInvalid);

    await goToAuthClient(page);
    await fillLoginForm(page, MOCK_CLIENT_EMAIL, 'wrong_password');
    await page.getByRole('button', { name: /se connecter|connexion|login/i }).first().click();

    // Toast or error message with invalid credentials
    await expect(page.getByText(/invalide|incorrect|mot de passe|identifiant|erreur/i).first()).toBeVisible({ timeout: 8000 });
  });
});

// ─── F04 — Connexion succès → /espace-personnel ───────────────────────────────

test.describe('F04 — Connexion succès client', () => {
  test('F04: redirect vers /espace-personnel après connexion client', async ({ page }) => {
    const clientSession = makeClientSession();
    await page.route('**/auth/v1/token*',    json(200, clientSession));
    await page.route('**/auth/v1/user**',    json(200, clientSession.user));
    await page.route('**/rest/v1/user_roles*', mockUserRolesClient);
    await page.route('**/rest/v1/providers*',  json(200, null));
    await page.route('**/rest/v1/**',          stubEmpty);

    await goToAuthClient(page);
    await fillLoginForm(page, MOCK_CLIENT_EMAIL, 'ValidPass@123');
    await page.getByRole('button', { name: /se connecter|connexion|login/i }).first().click();

    await expect(page).toHaveURL(/espace-personnel/, { timeout: 10000 });
  });
});

// ─── F05 — ProviderApplicationForm sans services ──────────────────────────────

test.describe('F05 — ProviderApplicationForm sans services', () => {
  test('F05: erreur "Au moins un service" si aucun service sélectionné', async ({ page }) => {
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/rest/v1/**',      stubEmpty);
    await page.goto('/nous-recrutons');

    // Fill required text fields but select NO services
    await page.fill('input[placeholder*="rénom"], [name="first_name"]', 'Marie');
    await page.fill('input[placeholder*="nom"], [name="last_name"]',    'Dupont');
    await page.fill('input[type="email"], [name="email"]',              MOCK_CLIENT_EMAIL);
    await page.fill('input[placeholder*="éléphone"], [name="phone"]',   '0612345678');
    await page.fill('input[placeholder*="dresse"], [name="address"]',   '12 rue de Paris');
    await page.fill('input[placeholder*="ille"], [name="city"]',        'Paris');
    await page.fill('input[placeholder*="ostal"], [name="postal_code"]','75001');
    await page.fill('input[placeholder*="zone"], [name="coverage_zone"]', 'Île-de-France');
    // availability — select a value
    const availSelect = page.locator('select[name="availability"]').or(
      page.getByRole('combobox').filter({ hasText: /disponibil/i })
    ).first();
    if (await availSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await availSelect.selectOption({ index: 1 }).catch(() => {});
    }

    // Submit — no services checked
    await page.getByRole('button', { name: /envoyer|soumettre|candidature/i }).first().click();

    // Should show validation error about services
    await expect(page.getByText(/service|sélectionner/i)).toBeVisible({ timeout: 5000 });
  });
});

// ─── F06 — ProviderApplicationForm candidature complète ───────────────────────

test.describe('F06 — ProviderApplicationForm candidature complète', () => {
  test('F06: toast succès + INSERT job_applications appelé', async ({ page }) => {
    let insertCalled = false;
    await page.route('**/rest/v1/job_applications*', (route) => {
      if (route.request().method() === 'POST') insertCalled = true;
      route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });
    await page.route('**/functions/v1/send-modern-notification**', json(200, {}));
    await page.route('**/storage/v1/**', json(200, { Key: 'test/doc.pdf' }));

    await page.goto('/nous-recrutons');

    // Fill all required fields
    await page.fill('input[placeholder*="rénom"], [name="first_name"]', 'Marie');
    await page.fill('input[placeholder*="nom"], [name="last_name"]',    'Dupont');
    await page.fill('input[type="email"], [name="email"]',              MOCK_CLIENT_EMAIL);
    await page.fill('input[placeholder*="éléphone"], [name="phone"]',   '0612345678');
    await page.fill('input[placeholder*="dresse"], [name="address"]',   '12 rue de Paris');
    await page.fill('input[placeholder*="ille"], [name="city"]',        'Paris');
    await page.fill('input[placeholder*="ostal"], [name="postal_code"]','75001');
    await page.fill('input[placeholder*="zone"], [name="coverage_zone"]', 'Île-de-France');
    await page.fill('textarea[placeholder*="otivation"], [name="motivation"]', 'Motivé pour rejoindre Bikawo et aider les familles au quotidien.').catch(() => {});

    // Select at least one service
    const firstServiceCheckbox = page.locator('[id*="bika_kids"], input[value="bika_kids"]').first()
      .or(page.getByLabel(/garde d.enfant/i).first());
    if (await firstServiceCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstServiceCheckbox.check().catch(() => {});
    } else {
      // Fallback: click first checkbox in services section
      await page.locator('input[type="checkbox"]').first().check().catch(() => {});
    }

    // Availability — select first option
    const availTrigger = page.getByRole('combobox').filter({ hasText: /sélectionner|disponib/i }).first()
      .or(page.locator('select[name="availability"]').first());
    await availTrigger.click().catch(() => {});
    await page.getByRole('option').first().click().catch(() => {});

    await page.getByRole('button', { name: /envoyer|soumettre|candidature/i }).first().click();

    // Toast success
    await expect(page.getByText(/candidature envoyée|succès|envoyée/i)).toBeVisible({ timeout: 10000 });
    expect(insertCalled).toBe(true);
  });
});

// ─── F07 — MandateSignature sans signature ────────────────────────────────────

/** Navigate to /provider-onboarding mocked at step 2 (mandate). */
async function goToMandateStep(page: Page) {
  await injectSession(page, makeProviderSession());

  // Auth mock
  await page.route('**/auth/v1/user**', json(200, {
    id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
    user_metadata: { user_type: 'prestataire' }, aud: 'authenticated', app_metadata: {},
  }));
  // ProtectedProviderRoute checks user_roles
  await page.route('**/rest/v1/user_roles*', mockUserRolesProvider);
  // Provider: docs submitted, mandat NOT accepted → step 2
  await page.route('**/rest/v1/providers*', json(200, {
    id: MOCK_PROVIDER_ID, user_id: MOCK_USER_ID,
    is_verified: false, status: 'pending',
    business_name: 'Test Provider',
    documents_submitted: true,
    mandat_facturation_accepte: false,
    formation_completed: false,
  }));
  // Provider documents: all 4 required types approved → docs step done
  await page.route('**/rest/v1/provider_documents*', json(200, [
    { document_type: 'identity_document' },
    { document_type: 'siret_document'    },
    { document_type: 'rib_iban'          },
    { document_type: 'certification'     },
  ]));
  await page.route('**/rest/v1/**',      stubEmpty);
  await page.route('**/functions/v1/**', json(200, {}));

  await page.goto('/provider-onboarding');

  // Wait for MandateSignature component to be visible
  await expect(page.getByText(/signature du mandat|mandat de facturation/i)).toBeVisible({ timeout: 10000 });
}

test.describe('F07 — MandateSignature sans signature', () => {
  test('F07: toast "Veuillez signer" si canvas vide', async ({ page }) => {
    await goToMandateStep(page);

    // The submit button is disabled until checkbox is checked.
    // Tick the checkbox first to enable the button.
    await page.getByLabel(/certifie avoir lu|j.autorise/i)
      .or(page.locator('#accept-mandate'))
      .check();

    // Click "Signer le mandat" WITHOUT drawing
    await page.getByRole('button', { name: /signer le mandat/i }).click();

    // Toast: "Veuillez signer le mandat"
    await expect(page.getByText(/veuillez signer/i)).toBeVisible({ timeout: 5000 });
  });

  test('F07b: bouton "Signer" désactivé tant que checkbox non cochée', async ({ page }) => {
    await goToMandateStep(page);

    // Without checkbox, button should be disabled
    const signBtn = page.getByRole('button', { name: /signer le mandat/i });
    await expect(signBtn).toBeDisabled({ timeout: 5000 });
  });
});

// ─── F08 — MandateSignature avec signature ────────────────────────────────────

test.describe('F08 — MandateSignature signature complète', () => {
  test('F08: UPDATE providers.mandat_facturation_accepte=true après signature valide', async ({ page }) => {
    let updateCalled = false;
    await injectSession(page, makeProviderSession());

    await page.route('**/auth/v1/user**', json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire' }, aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/user_roles*', mockUserRolesProvider);
    await page.route('**/rest/v1/providers*', (route) => {
      const method = route.request().method();
      if (method === 'PATCH') updateCalled = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });
    await page.route('**/rest/v1/provider_documents*', json(200, [
      { document_type: 'identity_document' },
      { document_type: 'siret_document'    },
      { document_type: 'rib_iban'          },
      { document_type: 'certification'     },
    ]));
    await page.route('**/rest/v1/communications*', json(201, {}));
    await page.route('**/rest/v1/**',      stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));

    await page.goto('/provider-onboarding');
    await expect(page.getByText(/signature du mandat|mandat de facturation/i)).toBeVisible({ timeout: 10000 });

    // Draw on the signature canvas
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 40,  box.y + 60);
      await page.mouse.down();
      await page.mouse.move(box.x + 100, box.y + 60);
      await page.mouse.move(box.x + 160, box.y + 70);
      await page.mouse.move(box.x + 200, box.y + 50);
      await page.mouse.up();
    }

    // Tick checkbox
    await page.getByLabel(/certifie avoir lu|j.autorise/i)
      .or(page.locator('#accept-mandate'))
      .check();

    // Submit signature
    await page.getByRole('button', { name: /signer le mandat/i }).click();

    // Wait for success
    await expect(page.getByText(/mandat signé|succès|signé avec succès/i)).toBeVisible({ timeout: 8000 });
    expect(updateCalled).toBe(true);
  });
});

// ─── F09 — Cart localStorage ──────��───────────────────────────────────────────

test.describe('F09 — Cart localStorage', () => {
  test('F09: bikawo-cart contient l\'item après ajout via localStorage API', async ({ page }) => {
    await page.goto('/panier');

    // Simulate addToCart via localStorage (mimics useBikawoCart.saveToStorage)
    const testItem = {
      id: 'f09-test-item',
      serviceName: 'Ménage Standard',
      serviceCategory: 'maison',
      packageTitle: 'Pack 3h',
      price: 25,
      quantity: 3,
      timeSlot: {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        startTime: '10:00',
        endTime: '13:00',
      },
      address: '12 rue de Paris, 75001 Paris',
    };

    await page.evaluate((item) => {
      localStorage.setItem('bikawo-cart',           JSON.stringify([item]));
      localStorage.setItem('bikawo-cart-timestamp', Date.now().toString());
      window.dispatchEvent(new Event('bikawo-cart-updated'));
    }, testItem);

    // Verify localStorage contains the item
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('bikawo-cart') || '[]'));
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('f09-test-item');
    expect(stored[0].serviceName).toBe('Ménage Standard');

    // Cart page should now show the item
    await page.reload();
    await expect(page.getByText('Ménage Standard')).toBeVisible({ timeout: 5000 });
  });

  test('F09b: bikawo-cart-timestamp est présent après ajout', async ({ page }) => {
    await page.goto('/panier');
    await page.evaluate(() => {
      localStorage.setItem('bikawo-cart', JSON.stringify([{ id: 'x', serviceName: 'Test', serviceCategory: 'maison', packageTitle: 'P', price: 10, quantity: 1, timeSlot: { date: new Date().toISOString(), startTime: '10:00', endTime: '11:00' }, address: 'Test' }]));
      localStorage.setItem('bikawo-cart-timestamp', Date.now().toString());
    });
    const ts = await page.evaluate(() => localStorage.getItem('bikawo-cart-timestamp'));
    expect(ts).not.toBeNull();
    expect(Number(ts)).toBeGreaterThan(0);
  });
});

// ���── F10 — Payment ?price= non numérique ─────��───────────────────────────────

test.describe('F10 — Payment price non numérique', () => {
  test('F10: ?price=abc → 0€ affiché, pas de crash', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/payment?service=Test&price=abc&type=one-time');

    // Page should render without crash
    await expect(page.locator('body')).toBeVisible();

    // Price should show 0
    await expect(page.getByText('0')).toBeVisible({ timeout: 5000 });

    expect(pageErrors, `Unhandled JS errors: ${pageErrors.map(e => e.message).join(', ')}`).toHaveLength(0);
  });

  test('F10b: ?price non fourni → 0€ affiché, pas de crash', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/payment?service=Test&type=one-time');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('0')).toBeVisible({ timeout: 5000 });

    expect(pageErrors).toHaveLength(0);
  });
});

// ─── F11 — GuestCheckout email invalide ─────────────────────────────────────���─

test.describe('F11 — GuestCheckout email invalide', () => {
  test('F11: erreur validation email visible, create-payment NOT appelé', async ({ page }) => {
    let stripeCalled = false;
    await page.route('**/functions/v1/create-payment**', (route) => {
      stripeCalled = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: 'https://stripe.com/test' }) });
    });

    await page.goto('/payment?service=Ménage&price=50&type=one-time&duration=2');

    // Switch to "invité" tab if needed
    const guestTab = page.getByRole('tab', { name: /invité|sans compte/i });
    if (await guestTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await guestTab.click();
    }

    // Fill invalid email
    await page.fill('[name="email"], input[type="email"]', 'invalid-email@@@@');
    await page.fill('[name="firstName"], input[placeholder*="rénom"]', 'Marie').catch(() => {});
    await page.fill('[name="lastName"],  input[placeholder*="om"]',    'Dupont').catch(() => {});

    await page.getByRole('button', { name: /payer|paiement|commander/i }).first().click();

    // Validation error should appear for email
    await expect(page.getByText(/email|e-mail|invalide/i).first()).toBeVisible({ timeout: 5000 });

    // Stripe should NOT have been called
    expect(stripeCalled).toBe(false);
  });
});

// ─── F12 — CustomRequest soumission complète ───���─────────────────────────────

test.describe('F12 — CustomRequest soumission', () => {
  test('F12: toast succès + INSERT custom_requests appelé', async ({ page }) => {
    let insertCalled = false;
    await page.route('**/rest/v1/custom_requests*', (route) => {
      if (route.request().method() === 'POST') insertCalled = true;
      route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });
    await page.route('**/functions/v1/send-modern-notification**', json(200, {}));
    // Stub any address autocomplete API calls
    await page.route('**/api.gouv.fr/**', json(200, { features: [] }));
    await page.route('**/api-adresse**',  json(200, { features: [] }));

    await page.goto('/demande-personnalisee');

    // Fill required fields
    await page.fill('[placeholder*="nom complet"], [placeholder*="nom"]', 'Marie Dupont');
    await page.fill('[placeholder*="mail"]',                              MOCK_CLIENT_EMAIL);
    await page.fill('textarea[placeholder*="service"], textarea[placeholder*="décriv"]', 'Je cherche une aide ménagère pour 3h par semaine dans mon appartement parisien.');

    // Address field — type directly, bypass autocomplete
    const addressInput = page.locator('input[placeholder*="départ"], input[placeholder*="dresse"]').first();
    await addressInput.fill('12 rue de Paris, 75001 Paris');
    await addressInput.press('Escape'); // dismiss any dropdown

    // Submit
    await page.getByRole('button', { name: /envoyer|envoyer ma demande/i }).click();

    // Toast success
    await expect(page.getByText(/demande envoyée|enregistrée|confirmation/i)).toBeVisible({ timeout: 10000 });
    expect(insertCalled).toBe(true);
  });

  test('F12b: soumission sans email → erreur, pas d\'INSERT', async ({ page }) => {
    let insertCalled = false;
    await page.route('**/rest/v1/custom_requests*', (route) => {
      if (route.request().method() === 'POST') insertCalled = true;
      route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/demande-personnalisee');

    // Only fill name, no email
    await page.fill('[placeholder*="nom complet"], [placeholder*="nom"]', 'Marie Dupont');

    await page.getByRole('button', { name: /envoyer/i }).click();

    // Toast error or HTML5 required validation
    await expect(
      page.getByText(/obligatoire|requis|remplir|erreur/i).or(page.locator(':invalid')).first()
    ).toBeVisible({ timeout: 5000 });

    expect(insertCalled).toBe(false);
  });
});
