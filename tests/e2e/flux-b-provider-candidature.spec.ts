/**
 * Flux B — Candidature & compte prestataire
 *
 * Couvre :
 *   B01-B09  Formulaire candidature public (/nous-recrutons)
 *   P01-P08  Inscription / connexion prestataire (/auth/provider)
 *   O01-O04  Onboarding (/provider-onboarding)
 *   G01-G04  Guards ProtectedProviderRoute
 */

import { test, expect, type Page } from '@playwright/test';
import {
  json,
  stub200,
  stubEmpty,
  mockLoginSuccess,
  mockLoginInvalid,
  mockSignupSuccess,
  mockSignupGhostUser,
  mockUserRolesProvider,
  mockProviderUnverifiedSingle,
  mockProviderVerifiedSingle,
  mockProviderNullSingle,
  mockProviderDocsEmpty,
  mockStorageUpload,
  makeProviderSession,
  makeClientSession,
  injectSession,
  minimalPdfBuffer,
  MOCK_PROVIDER_EMAIL,
  MOCK_USER_ID,
  MOCK_PROVIDER_ID,
} from './helpers/supabase-mocks';

// ─── Navigation helpers ───────────────────────────────────────────────────────

async function goToNousRecrutons(page: Page) {
  await page.goto('/nous-recrutons');
  await expect(page.getByRole('heading', { name: /Rejoignez l.équipe Bikawo/i })).toBeVisible({ timeout: 10_000 });
}

async function goToProviderAuth(page: Page) {
  await page.goto('/auth/provider');
  await expect(page.getByRole('heading', { name: /Connexion Prestataire/i })).toBeVisible({ timeout: 10_000 });
}

/** Fill all required text fields of ProviderSignup. */
async function fillCandidatureForm(page: Page) {
  await page.getByPlaceholder('Jean').fill('Sophie');
  await page.getByPlaceholder('Dupont').fill('Martin');
  await page.locator('input[type="email"]').fill(`e2e-${Date.now()}@test.bikawo.fr`);
  await page.locator('input[type="tel"]').fill('0612345678');
  await page.getByPlaceholder('Numéro, rue').fill('10 avenue de la Paix');
  await page.locator('[data-testid="input-city"]').fill('Paris');
  await page.getByPlaceholder('75001').fill('75001');
  // Zone géographique
  await page.getByPlaceholder(/Paris et proche banlieue/i).fill('Paris 75');
  // Sélectionner au moins un service
  await page.locator('#bika_kids').click();           // Checkbox Bika Kids
  // Disponibilités — Select Radix (scoped to avoid matching hidden <option> element)
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Flexible selon les besoins' }).click();
}

/**
 * Upload a minimal PDF to all required file inputs in order.
 * New DOC_FIELDS order: identity(0), siret(1), rib(2), criminal_record(3), certification_nova(4), rc_pro(5), certifications(6)
 */
async function uploadRequiredDocs(page: Page) {
  const pdf = minimalPdfBuffer();
  const fileInputs = page.locator('input[type="file"]');
  const count = await fileInputs.count();
  // Required: identity (0), siret (1), rib (2)
  const requiredIndexes = [0, 1, 2];
  for (const i of requiredIndexes) {
    if (i < count) {
      await fileInputs.nth(i).setInputFiles({
        name: `doc-${i}.pdf`,
        mimeType: 'application/pdf',
        buffer: pdf,
      });
    }
  }
}

/** Set up all network mocks needed for a successful candidature submission. */
async function setupCandidatureMocks(page: Page) {
  await page.route('**/storage/v1/object/**',               mockStorageUpload);
  await page.route('**/rest/v1/job_applications*',          stub200);
  await page.route('**/functions/v1/send-modern-notification', stub200);
}

/** Mocks for the ProviderAuth login flow (unverified provider). */
async function setupLoginUnverifiedMocks(page: Page) {
  await page.route('**/auth/v1/token*', mockLoginSuccess({ email: MOCK_PROVIDER_EMAIL }));
  await page.route('**/rest/v1/providers*', mockProviderUnverifiedSingle);
}

/** Mocks for the ProviderAuth login flow (verified provider). */
async function setupLoginVerifiedMocks(page: Page) {
  await page.route('**/auth/v1/token*', mockLoginSuccess({ email: MOCK_PROVIDER_EMAIL }));
  await page.route('**/rest/v1/providers*', mockProviderVerifiedSingle);
}

/** Mocks for a successful ProviderAuth signup. */
async function setupProviderSignupMocks(page: Page) {
  // Catch-alls first (LIFO: lower priority — checked last)
  // auth/v1 returns 401 → SIGNED_OUT after SIGNED_IN prevents auth guard redirect
  await page.route('**/auth/v1/**',     json(401, { error: 'no session' }));
  await page.route('**/rest/v1/**',     json(200, []));
  // Specific mocks last (higher priority — checked first)
  // checkEmailExists queries user_roles + providers
  await page.route('**/rest/v1/user_roles*',          stubEmpty);
  await page.route('**/rest/v1/providers*',           stubEmpty);
  // Use regex: emailRedirectTo adds ?redirect_to=... which breaks glob '**/auth/v1/signup'
  await page.route(/\/auth\/v1\/signup/, mockSignupSuccess({ email: MOCK_PROVIDER_EMAIL }));
  await page.route('**/functions/v1/**',               stub200);
}

// ─── B — Formulaire candidature public (/nous-recrutons) ─────────────────────

test.describe('Flux B — Formulaire candidature prestataire', () => {

  test('B01 — /nous-recrutons charge la page avec les sections attendues', async ({ page }) => {
    await goToNousRecrutons(page);
    await expect(page.getByText(/Informations personnelles/i)).toBeVisible();
    await expect(page.getByText(/Services proposés/i)).toBeVisible();
    await expect(page.getByText(/Zone géographique et disponibilités/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Documents obligatoires/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Envoyer ma candidature/i })).toBeVisible();
  });

  test('B01b — /candidature-prestataire est un alias de /nous-recrutons', async ({ page }) => {
    await page.goto('/candidature-prestataire');
    await expect(page.getByRole('heading', { name: /Rejoignez l.équipe Bikawo/i })).toBeVisible({ timeout: 10_000 });
  });

  test.describe('B02-B06 — Validation des champs obligatoires', () => {

    test.beforeEach(async ({ page }) => {
      await goToNousRecrutons(page);
    });

    test('B02 — soumission vide affiche les erreurs de validation', async ({ page }) => {
      await page.getByRole('button', { name: /Envoyer ma candidature/i }).click();
      // react-hook-form mode:onChange — messages apparaissent au submit ou au blur
      await expect(page.getByText(/au moins 2 caractères|prénom/i).first()).toBeVisible({ timeout: 6_000 });
    });

    test('B03 — email invalide affiche l\'erreur de format', async ({ page }) => {
      await page.locator('input[type="email"]').fill('pasunemail');
      await page.locator('input[type="tel"]').click();
      await expect(page.getByText(/Email invalide/i)).toBeVisible();
    });

    test('B04 — téléphone au mauvais format affiche l\'erreur', async ({ page }) => {
      await page.locator('input[type="tel"]').fill('123');
      await page.locator('input[type="email"]').click();
      await expect(page.getByText(/Format de téléphone invalide/i)).toBeVisible();
    });

    test('B05 — code postal non numérique affiche l\'erreur', async ({ page }) => {
      await page.getByPlaceholder('75001').fill('ABCDE');
      await page.locator('[data-testid="input-city"]').click();
      await expect(page.getByText(/Code postal invalide/i)).toBeVisible();
    });

    test('B06 — aucun service sélectionné affiche l\'erreur', async ({ page }) => {
      // Remplir tout sauf les services, puis soumettre
      await page.getByPlaceholder('Jean').fill('Sophie');
      await page.getByPlaceholder('Dupont').fill('Martin');
      await page.locator('input[type="email"]').fill('test@test.fr');
      await page.locator('input[type="tel"]').fill('0612345678');
      await page.getByPlaceholder('Numéro, rue').fill('10 rue de la Paix');
      await page.locator('[data-testid="input-city"]').fill('Paris');
      await page.getByPlaceholder('75001').fill('75001');
      await page.getByPlaceholder(/Paris et proche banlieue/i).fill('Paris 75');
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: 'Flexible selon les besoins' }).click();
      await page.getByRole('button', { name: /Envoyer ma candidature/i }).click();
      await expect(page.getByText(/au moins un service/i)).toBeVisible({ timeout: 6_000 });
    });
  });

  test('B07 — candidature complète → affiche ProviderSignupSuccess', async ({ page }) => {
    await setupCandidatureMocks(page);
    await goToNousRecrutons(page);
    await fillCandidatureForm(page);
    // Mock du Storage AVANT l'upload
    await uploadRequiredDocs(page);
    await page.getByRole('button', { name: /Envoyer ma candidature/i }).click();
    // La page de succès doit apparaître
    await expect(page.getByText(/Candidature envoyée avec succès/i)).toBeVisible({ timeout: 15_000 });
  });

  test('B08 — l\'email soumis est affiché dans la page de succès', async ({ page }) => {
    const email = `e2e-success-${Date.now()}@test.bikawo.fr`;
    await setupCandidatureMocks(page);
    await goToNousRecrutons(page);
    await page.getByPlaceholder('Jean').fill('Sophie');
    await page.getByPlaceholder('Dupont').fill('Martin');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="tel"]').fill('0612345678');
    await page.getByPlaceholder('Numéro, rue').fill('10 avenue de la Paix');
    await page.locator('[data-testid="input-city"]').fill('Paris');
    await page.getByPlaceholder('75001').fill('75001');
    await page.getByPlaceholder(/Paris et proche banlieue/i).fill('Paris 75');
    await page.locator('#bika_kids').click();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Flexible selon les besoins' }).click();
    await uploadRequiredDocs(page);
    await page.getByRole('button', { name: /Envoyer ma candidature/i }).click();
    await expect(page.getByText(email)).toBeVisible({ timeout: 15_000 });
  });

  test('B09 — erreur DB affiche un toast d\'erreur', async ({ page }) => {
    await page.route('**/storage/v1/object/**',            mockStorageUpload);
    await page.route('**/rest/v1/job_applications*',       json(500, { message: 'Server error' }));
    await page.route('**/functions/v1/**',                  stub200);
    await goToNousRecrutons(page);
    await fillCandidatureForm(page);
    await uploadRequiredDocs(page);
    await page.getByRole('button', { name: /Envoyer ma candidature/i }).click();
    await expect(page.getByText('Erreur', { exact: true })).toBeVisible({ timeout: 10_000 });
    // La page de succès NE doit PAS apparaître
    await expect(page.getByText(/Candidature envoyée avec succès/i)).not.toBeVisible();
  });

  test('B10 — bouton "Retour à l\'accueil" sur la page succès navigue vers /', async ({ page }) => {
    await setupCandidatureMocks(page);
    await goToNousRecrutons(page);
    await fillCandidatureForm(page);
    await uploadRequiredDocs(page);
    await page.getByRole('button', { name: /Envoyer ma candidature/i }).click();
    await expect(page.getByText(/Candidature envoyée avec succès/i)).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Retour à l.accueil/i }).click();
    await expect(page).toHaveURL('/');
  });
});

// ─── P — Inscription / connexion prestataire (/auth/provider) ────────────────

test.describe('Flux B — Auth prestataire (/auth/provider)', () => {

  test('P01 — page charge avec le formulaire de connexion prestataire', async ({ page }) => {
    await goToProviderAuth(page);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();
  });

  test('P02 — lien "Devenir prestataire" affiche le formulaire d\'inscription', async ({ page }) => {
    await goToProviderAuth(page);
    await page.getByRole('button', { name: /Devenir prestataire/i }).click();
    await expect(page.getByRole('heading', { name: /Créer mon compte/i })).toBeVisible();
    // Le champ "Nom complet" doit apparaître (spécifique au signup prestataire)
    await expect(page.getByPlaceholder(/Nom complet/i)).toBeVisible();
  });

  test('P02b — retour connexion depuis inscription', async ({ page }) => {
    await goToProviderAuth(page);
    await page.getByRole('button', { name: /Devenir prestataire/i }).click();
    await expect(page.getByRole('heading', { name: /Créer mon compte/i })).toBeVisible();
    // Cherche le toggle "Déjà un compte ? Se connecter"
    await page.getByRole('button', { name: /Se connecter/i }).first().click();
    await expect(page.getByRole('heading', { name: /Connexion Prestataire/i })).toBeVisible();
  });

  test('P03 — connexion sans compte prestataire affiche l\'erreur', async ({ page }) => {
    await page.route('**/auth/v1/token*',    mockLoginSuccess({ email: MOCK_PROVIDER_EMAIL }));
    // providers renvoie null → ce compte n'est pas prestataire
    await page.route('**/rest/v1/providers*', mockProviderNullSingle);
    await goToProviderAuth(page);
    await page.locator('input[type="email"]').fill(MOCK_PROVIDER_EMAIL);
    await page.locator('input[type="password"]').fill('TestPass1!');
    await page.getByRole('button', { name: /Se connecter/i }).click();
    await expect(
      page.locator('[role="status"]').getByText(/pas un compte prestataire|soumettre votre candidature/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test('P04 — connexion provider non vérifié redirige vers /provider-onboarding', async ({ page }) => {
    await setupLoginUnverifiedMocks(page);
    await goToProviderAuth(page);
    await page.locator('input[type="email"]').fill(MOCK_PROVIDER_EMAIL);
    await page.locator('input[type="password"]').fill('TestPass1!');
    await page.getByRole('button', { name: /Se connecter/i }).click();
    // Après login avec is_verified=false → navigate('/provider-onboarding')
    // L'onboarding query providers & provider_documents
    await page.route('**/rest/v1/providers*',           mockProviderUnverifiedSingle);
    await page.route('**/rest/v1/provider_documents*',  mockProviderDocsEmpty);
    await expect(page).toHaveURL(/provider-onboarding/, { timeout: 10_000 });
  });

  test('P05 — connexion provider vérifié redirige vers /espace-prestataire', async ({ page }) => {
    await setupLoginVerifiedMocks(page);
    // ProtectedProviderRoute vérifie is_verified via providers query
    await page.route('**/rest/v1/user_roles*', mockUserRolesProvider);
    await goToProviderAuth(page);
    await page.locator('input[type="email"]').fill(MOCK_PROVIDER_EMAIL);
    await page.locator('input[type="password"]').fill('TestPass1!');
    await page.getByRole('button', { name: /Se connecter/i }).click();
    await expect(page).toHaveURL(/espace-prestataire/, { timeout: 10_000 });
  });

  test('P06 — inscription réussie affiche le toast de succès', async ({ page }) => {
    await setupProviderSignupMocks(page);
    await goToProviderAuth(page);
    await page.getByRole('button', { name: /Devenir prestataire/i }).click();
    await expect(page.getByPlaceholder(/Nom complet/i)).toBeVisible();
    // Remplir le formulaire d'inscription
    await page.getByPlaceholder(/Nom complet/i).fill('Sophie Martin');
    await page.locator('input[type="email"]').fill(MOCK_PROVIDER_EMAIL);
    await page.locator('input[type="password"]').first().fill('TestPass1!');
    // Téléphone (optionnel dans providerSignupSchema)
    // Submit
    await page.getByRole('button', { name: 'Créer mon compte prestataire' }).click();
    await expect(page.getByText(/Inscription réussie/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('P07 — email déjà utilisé affiche toast avec bouton "Se connecter"', async ({ page }) => {
    await page.route('**/auth/v1/**',     json(401, { error: 'no session' }));
    await page.route('**/rest/v1/**',     json(200, []));
    await page.route('**/auth/v1/user**', json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire' }, aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/user_roles*',  json(200, [{ user_id: MOCK_USER_ID }])); // checkEmailExists trouvera quelque chose
    await page.route(/\/auth\/v1\/signup/, mockSignupGhostUser);
    await page.route('**/functions/v1/**',        stub200);
    await goToProviderAuth(page);
    await page.getByRole('button', { name: /Devenir prestataire/i }).click();
    await page.getByPlaceholder(/Nom complet/i).fill('Sophie Martin');
    await page.locator('input[type="email"]').fill(MOCK_PROVIDER_EMAIL);
    await page.locator('input[type="password"]').first().fill('TestPass1!');
    await page.locator('form').getByRole('button', { name: /Créer|S'inscrire|Inscription/i }).last().click();
    await expect(
      page.getByText(/déjà utilisé|identifiant déjà utilisé/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('P08 — indicateur de force du mot de passe est visible pendant la saisie', async ({ page }) => {
    await goToProviderAuth(page);
    await page.getByRole('button', { name: /Devenir prestataire/i }).click();
    await page.locator('input[type="password"]').first().fill('abc');
    // L'indicateur "Faible" doit apparaître
    await expect(page.getByText(/Faible|Moyen|Fort/i)).toBeVisible();
  });

  test('P09 — mauvais mot de passe au login affiche le toast d\'erreur', async ({ page }) => {
    await page.route('**/auth/v1/token*', mockLoginInvalid);
    await goToProviderAuth(page);
    await page.locator('input[type="email"]').fill(MOCK_PROVIDER_EMAIL);
    await page.locator('input[type="password"]').fill('Wrongpassword1!');
    await page.getByRole('button', { name: /Se connecter/i }).click();
    await expect(
      page.getByText('Erreur de connexion', { exact: true })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('P10 — lien "Retour à l\'accueil" navigue vers /', async ({ page }) => {
    await goToProviderAuth(page);
    await page.getByText(/Retour à l.accueil/i).click();
    await expect(page).toHaveURL('/');
  });
});

// ─── O — Onboarding prestataire (/provider-onboarding) ───────────────────────

test.describe('Flux B — Onboarding prestataire (/provider-onboarding)', () => {

  test('O01 — sans session redirige vers /auth/provider', async ({ page }) => {
    await page.goto('/provider-onboarding');
    await expect(page).toHaveURL(/auth\/provider/, { timeout: 8_000 });
  });

  test('O02 — avec session mais sans record provider → redirige vers /auth/provider', async ({ page }) => {
    await injectSession(page, makeProviderSession());
    await page.route('**/auth/v1/**',     json(401, { error: 'no session' }));
    await page.route('**/rest/v1/**',     json(200, []));
    await page.route('**/auth/v1/user**', json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire' }, aud: 'authenticated', app_metadata: {},
    }));
    // providers query renvoie null → fetchOnboardingData retourne null → navigate('/auth/provider')
    await page.route('**/rest/v1/providers*',          mockProviderNullSingle);
    await page.route('**/rest/v1/user_roles*',         mockUserRolesProvider);
    await page.goto('/provider-onboarding');
    await expect(page).toHaveURL(/auth\/provider/, { timeout: 10_000 });
  });

  test('O03 — provider actif (status=active) redirige vers /espace-prestataire', async ({ page }) => {
    await injectSession(page, makeProviderSession());
    await page.route('**/auth/v1/**',     json(401, { error: 'no session' }));
    await page.route('**/rest/v1/**',     json(200, []));
    await page.route('**/auth/v1/user**', json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire' }, aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/providers*',         mockProviderVerifiedSingle);
    await page.route('**/rest/v1/user_roles*',        mockUserRolesProvider);
    await page.route('**/rest/v1/provider_documents*', mockProviderDocsEmpty);
    await page.goto('/provider-onboarding');
    await expect(page).toHaveURL(/espace-prestataire/, { timeout: 10_000 });
  });

  test('O04 — provider en step 1 affiche la section Documents', async ({ page }) => {
    await injectSession(page, makeProviderSession());
    await page.route('**/auth/v1/**',     json(401, { error: 'no session' }));
    await page.route('**/rest/v1/**',     json(200, []));
    await page.route('**/auth/v1/user**', json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire' }, aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/providers*',          mockProviderUnverifiedSingle);
    await page.route('**/rest/v1/user_roles*',         mockUserRolesProvider);
    await page.route('**/rest/v1/provider_documents*', mockProviderDocsEmpty);
    await page.goto('/provider-onboarding');
    // L'onboarding charge et affiche le step 1 (Documents)
    await expect(page.getByText(/Bienvenue chez.*Bikawo/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Documents/i).first()).toBeVisible();
  });

  test('O05 — la barre de progression est visible', async ({ page }) => {
    await injectSession(page, makeProviderSession());
    await page.route('**/auth/v1/**',     json(401, { error: 'no session' }));
    await page.route('**/rest/v1/**',     json(200, []));
    await page.route('**/auth/v1/user**', json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire' }, aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/providers*',          mockProviderUnverifiedSingle);
    await page.route('**/rest/v1/user_roles*',         mockUserRolesProvider);
    await page.route('**/rest/v1/provider_documents*', mockProviderDocsEmpty);
    await page.goto('/provider-onboarding');
    await expect(page.getByText(/Bienvenue chez.*Bikawo/i)).toBeVisible({ timeout: 10_000 });
    // Le <Progress> Radix rend un div[role="progressbar"]
    await expect(page.getByRole('progressbar')).toBeVisible();
  });
});

// ─── G — Guards ProtectedProviderRoute ───────────────────────────────────────

test.describe('Flux B — Guards ProtectedProviderRoute', () => {

  test('G01 — /espace-prestataire sans session redirige vers /auth/provider', async ({ page }) => {
    await page.goto('/espace-prestataire');
    await expect(page).toHaveURL(/auth\/provider/, { timeout: 8_000 });
  });

  test('G02 — /provider-onboarding sans session redirige vers /auth/provider', async ({ page }) => {
    await page.goto('/provider-onboarding');
    await expect(page).toHaveURL(/auth\/provider/, { timeout: 8_000 });
  });

  test('G03 — /espace-prestataire avec rôle client affiche la carte "Accès restreint"', async ({ page }) => {
    await injectSession(page, makeClientSession());
    // AuthProvider fetchUserRoles → client role
    await page.route('**/rest/v1/user_roles*', json(200, [{ role: 'client', user_id: MOCK_USER_ID }]));
    await page.goto('/espace-prestataire');
    // ProtectedProviderRoute détecte primaryRole=client et affiche la carte d'erreur
    await expect(
      page.getByRole('button', { name: /Devenir prestataire/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('G04 — provider non vérifié sur /espace-prestataire (requireVerified) redirige vers /provider-onboarding', async ({ page }) => {
    await injectSession(page, makeProviderSession());
    // Mocks auth : catch-all 401 + /user 200 pour éviter que le SDK invalide le JWT de test via le vrai serveur
    // (LAST registered = highest priority in Playwright)
    await page.route('**/auth/v1/**',     json(401, { error: 'no session' }));
    await page.route('**/auth/v1/user**', json(200, makeProviderSession().user));
    // AuthProvider: rôle provider
    await page.route('**/rest/v1/user_roles*', mockUserRolesProvider);
    // ProtectedProviderRoute requireVerified → query providers → is_verified=false
    await page.route('**/rest/v1/providers*',  mockProviderUnverifiedSingle);
    // Onboarding page queries
    await page.route('**/rest/v1/provider_documents*', mockProviderDocsEmpty);
    await page.goto('/espace-prestataire');
    await expect(page).toHaveURL(/provider-onboarding/, { timeout: 10_000 });
  });

  test('G05 — /provider/dashboard (alias Stripe Connect) redirige correctement', async ({ page }) => {
    // Sans session → redirige vers /auth/provider (même protection que /espace-prestataire)
    await page.goto('/provider/dashboard');
    await expect(page).toHaveURL(/auth\/provider/, { timeout: 8_000 });
  });
});
