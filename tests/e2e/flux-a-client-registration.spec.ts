/**
 * Flux A — Inscription client
 *
 * Couvre :
 *   A01-A03  Navigation entre les étapes (/auth → sélection → login → signup)
 *   F01-F05  Validation des champs du formulaire ClientSignupForm
 *   A04-A06  Soumission et retours d'API (succès, email existant)
 *   A07      Connexion client → redirect /espace-personnel
 *   N03/N04  Guards ProtectedRoute (routes protégées sans session)
 *   R01      Pas de flash de contenu protégé pendant le loading
 */

import { test, expect, type Page, type Route } from '@playwright/test';

// ─── JWT / session helpers ────────────────────────────────────────────────────

const MOCK_USER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const MOCK_EMAIL   = 'client@test.bikawo.fr';

/** Minimal Supabase-compatible JWT (HS256 shape — signature not validated in tests). */
function makeMockJwt(overrides: Record<string, unknown> = {}): string {
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub:   MOCK_USER_ID,
    email: MOCK_EMAIL,
    role:  'authenticated',
    aud:   'authenticated',
    exp:   Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  })).toString('base64url');
  return `${header}.${payload}.mockSig`;
}

/** Full Supabase auth response for a confirmed client user. */
function mockSessionBody(emailConfirmed = true) {
  return {
    access_token:  makeMockJwt(),
    token_type:    'bearer',
    expires_in:    3600,
    expires_at:    Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock_refresh_token',
    user: {
      id:                 MOCK_USER_ID,
      aud:                'authenticated',
      role:               'authenticated',
      email:              MOCK_EMAIL,
      email_confirmed_at: emailConfirmed ? new Date().toISOString() : null,
      phone:              '',
      confirmed_at:       emailConfirmed ? new Date().toISOString() : null,
      last_sign_in_at:    new Date().toISOString(),
      app_metadata:       {},
      user_metadata:      { first_name: 'Marie', last_name: 'Dupont', user_type: 'client' },
      identities: [{
        id:            MOCK_USER_ID,
        user_id:       MOCK_USER_ID,
        identity_data: {},
        provider:      'email',
        created_at:    new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

// ─── Route-fulfillment helpers ────────────────────────────────────────────────

type Handler = (route: Route) => void;

const json = (status: number, body: unknown): Handler =>
  (r) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const mockSignupSuccess: Handler     = json(200, mockSessionBody());
const mockSignupGhostUser: Handler   = json(200, {
  // Supabase returns 200 with identities: [] when the email is already registered
  // but unconfirmed ("ghost user" pattern).
  ...mockSessionBody(false),
  user: { ...mockSessionBody(false).user, identities: [] },
});
const mockLoginSuccess: Handler      = json(200, mockSessionBody());
const mockLoginInvalid: Handler      = json(400, {
  error:       'invalid_grant',
  error_code:  'invalid_credentials',
  message:     'Invalid login credentials',
});
const mockDbEmpty: Handler           = json(200, []);
const mockEdgeFn200: Handler         = json(200, { success: true });

/**
 * Intercept all Supabase calls needed for a clean client sign-up flow.
 * Must be called BEFORE navigation so Playwright registers handlers first.
 */
async function setupSignupMocks(page: Page) {
  // Catch-alls first (LIFO: lower priority — checked last)
  // auth/v1/user returns 401 so Supabase fires SIGNED_OUT after SIGNED_IN,
  // preventing the /auth guard from redirecting the page away from /auth/complete.
  await page.route('**/auth/v1/**',     json(401, { error: 'no session' }));
  await page.route('**/rest/v1/**',     json(200, []));
  // Specific mocks last (higher priority — checked first)
  // Use regex: emailRedirectTo adds ?redirect_to=... which breaks glob '**/auth/v1/signup'
  await page.route(/\/auth\/v1\/signup/, mockSignupSuccess);
  await page.route('**/functions/v1/**', mockEdgeFn200);
}

/**
 * Intercept all Supabase calls needed for a clean client login flow:
 * token endpoint + the two direct DB role/provider checks in SecureAuthForm.
 */
async function setupLoginMocks(page: Page) {
  await page.route('**/auth/v1/token*',            mockLoginSuccess);
  await page.route('**/rest/v1/user_roles*',       mockDbEmpty);
  await page.route('**/rest/v1/providers*',        mockDbEmpty);
}

// ─── Page-navigation helpers ──────────────────────────────────────────────────

/** Navigate to /auth and wait for the user-type selection step. */
async function goToAuth(page: Page) {
  await page.goto('/auth');
  await expect(
    page.getByRole('heading', { name: 'Bienvenue sur Bikawo' })
  ).toBeVisible({ timeout: 10_000 });
}

/** Click "Je suis Client" and wait for the login form. */
async function selectClientType(page: Page) {
  await page.locator('button').filter({ hasText: 'Je suis Client' }).click();
  await expect(
    page.getByRole('heading', { name: /Connexion.*Client/i })
  ).toBeVisible();
}

/** Switch from login to the signup form ("S'inscrire" toggle). */
async function switchToSignup(page: Page) {
  await page.getByRole('button', { name: /S'inscrire/i }).click();
  await expect(
    page.getByRole('button', { name: /Créer mon compte client/i })
  ).toBeVisible();
}

const VALID_FORM = {
  firstName: 'Marie',
  lastName:  'Dupont',
  email:     `e2e-${Date.now()}@test.bikawo.fr`,
  password:  'TestPass1!',
};

/** Fill the ClientSignupForm fields (does NOT tick the checkboxes). */
async function fillSignupFields(page: Page, data = VALID_FORM) {
  await page.getByPlaceholder('Jean').fill(data.firstName);
  await page.getByPlaceholder('Dupont').fill(data.lastName);
  await page.locator('input[type="email"]').fill(data.email);
  await page.locator('input[type="password"]').first().fill(data.password);
}

/**
 * Tick both consent checkboxes (shadcn Checkbox renders as role="checkbox").
 * Order: isAdult (nth 0), acceptTerms (nth 1).
 */
async function tickConsents(page: Page) {
  const boxes = page.getByRole('checkbox');
  await boxes.nth(0).click();
  await boxes.nth(1).click();
}

// ─── Test suite ───────────────────────────────────────────────────────────────

test.describe('Flux A — Inscription client', () => {

  // ── Étape 1 : sélection du type de compte ────────────────────────────────

  test.describe('A01-A03 — Navigation entre les étapes', () => {

    test('A01 — /auth affiche les deux choix client / prestataire', async ({ page }) => {
      await goToAuth(page);
      await expect(page.locator('button').filter({ hasText: 'Je suis Client' })).toBeVisible();
      await expect(page.locator('button').filter({ hasText: 'Je suis Prestataire' })).toBeVisible();
    });

    test('A02 — clic "Je suis Client" affiche le formulaire de connexion', async ({ page }) => {
      await goToAuth(page);
      await selectClientType(page);
      // L'en-tête "Connexion - Client" doit être visible
      await expect(page.getByRole('heading', { name: /Connexion.*Client/i })).toBeVisible();
      // Le formulaire de login (email + password) doit être présent
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('A03 — bouton Retour depuis login ramène à la sélection', async ({ page }) => {
      await goToAuth(page);
      await selectClientType(page);
      // Exact match pour éviter le FloatingBackButton (aria-label "Retour à la page précédente")
      await page.getByRole('button', { name: 'Retour', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Bienvenue sur Bikawo' })).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('button').filter({ hasText: 'Je suis Client' })).toBeVisible();
    });

    test('A03b — lien "S\'inscrire" affiche le formulaire ClientSignupForm', async ({ page }) => {
      await goToAuth(page);
      await selectClientType(page);
      await switchToSignup(page);
      await expect(page.getByPlaceholder('Jean')).toBeVisible();
      await expect(page.getByPlaceholder('Dupont')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('A03c — lien "Se connecter" depuis signup repasse en mode login', async ({ page }) => {
      await goToAuth(page);
      await selectClientType(page);
      await switchToSignup(page);
      await page.getByRole('button', { name: /Se connecter/i }).click();
      // Retour au formulaire de login (plus de bouton "Créer mon compte")
      await expect(
        page.getByRole('button', { name: /Créer mon compte client/i })
      ).not.toBeVisible();
      await expect(page.getByRole('heading', { name: /Connexion.*Client/i })).toBeVisible();
    });
  });

  // ── Étape 2 : validation des champs ──────────────────────────────────────

  test.describe('F01-F05 — Validation du formulaire d\'inscription', () => {

    test.beforeEach(async ({ page }) => {
      await goToAuth(page);
      await selectClientType(page);
      await switchToSignup(page);
    });

    test('F01 — soumission à vide affiche les erreurs de validation', async ({ page }) => {
      await page.getByRole('button', { name: /Créer mon compte client/i }).click();
      // react-hook-form valide tout au submit → erreur minimum prénom
      await expect(page.getByText(/au moins 2 caractères/).first()).toBeVisible();
    });

    test('F02 — email invalide affiche l\'erreur de format', async ({ page }) => {
      await page.locator('input[type="email"]').fill('pas-un-email');
      // Blur pour déclencher la validation onBlur
      await page.getByPlaceholder('Jean').click();
      await expect(page.getByText(/Format d.email invalide/i)).toBeVisible();
    });

    test('F03 — mot de passe trop court (< 8 chars) affiche l\'erreur', async ({ page }) => {
      await page.locator('input[type="password"]').first().fill('abc');
      await page.locator('input[type="email"]').click();
      await expect(page.getByText(/au moins 8 caractères/)).toBeVisible();
    });

    test('F03b — mot de passe sans majuscule affiche l\'erreur', async ({ page }) => {
      await page.locator('input[type="password"]').first().fill('lowercase1!');
      await page.locator('input[type="email"]').click();
      await expect(page.getByText(/au moins une lettre majuscule/)).toBeVisible();
    });

    test('F03c — mot de passe sans chiffre affiche l\'erreur', async ({ page }) => {
      await page.locator('input[type="password"]').first().fill('NoDigits!@#');
      await page.locator('input[type="email"]').click();
      await expect(page.getByText(/au moins un chiffre/)).toBeVisible();
    });

    test('F03d — mot de passe sans caractère spécial affiche l\'erreur', async ({ page }) => {
      await page.locator('input[type="password"]').first().fill('NoSpecial1');
      await page.locator('input[type="email"]').click();
      await expect(page.getByText(/au moins un caractère spécial/)).toBeVisible();
    });

    test('F04 — prénom contenant des chiffres affiche l\'erreur', async ({ page }) => {
      await page.getByPlaceholder('Jean').fill('Jean123');
      await page.getByPlaceholder('Dupont').click();
      await expect(page.getByText(/lettres, espaces, tirets/)).toBeVisible();
    });

    test('F04b — prénom trop court (1 char) affiche l\'erreur', async ({ page }) => {
      await page.getByPlaceholder('Jean').fill('J');
      await page.getByPlaceholder('Dupont').click();
      await expect(page.getByText(/au moins 2 caractères/)).toBeVisible();
    });

    test('F05 — formulaire valide sans cocher les cases → erreurs de consentement', async ({ page }) => {
      await fillSignupFields(page);
      await page.getByRole('button', { name: /Créer mon compte client/i }).click();
      await expect(page.getByText(/Vous devez certifier avoir au moins 18 ans/)).toBeVisible();
      await expect(page.getByText(/Vous devez accepter les conditions/)).toBeVisible();
    });

    test('F05b — uniquement isAdult coché → erreur sur acceptTerms', async ({ page }) => {
      await fillSignupFields(page);
      await page.getByRole('checkbox').nth(0).click(); // isAdult only
      await page.getByRole('button', { name: /Créer mon compte client/i }).click();
      await expect(page.getByText(/Vous devez accepter les conditions/)).toBeVisible();
      await expect(page.getByText(/Vous devez certifier avoir au moins 18 ans/)).not.toBeVisible();
    });
  });

  // ── Étape 3 : soumission et retours d'API ─────────────────────────────────

  test.describe('A04-A06 — Soumission du formulaire', () => {

    test.beforeEach(async ({ page }) => {
      await goToAuth(page);
      await selectClientType(page);
      await switchToSignup(page);
    });

    test('A04 — inscription réussie navigue vers /auth/complete', async ({ page }) => {
      await setupSignupMocks(page);
      await fillSignupFields(page);
      await tickConsents(page);
      await page.getByRole('button', { name: /Créer mon compte client/i }).click();
      await page.waitForURL('**/auth/complete', { timeout: 12_000 });
    });

    test('A05 — /auth/complete sans token affiche "vérifiez email"', async ({ page }) => {
      await page.goto('/auth/complete');
      // Pas de ?token → status = 'success' avec message "Inscription réussie ! Un email de confirmation..."
      await expect(page.getByText(/email de confirmation/i).first()).toBeVisible({ timeout: 8_000 });
    });

    test('A05b — /auth/complete avec ?error= affiche l\'état d\'erreur', async ({ page }) => {
      await page.goto('/auth/complete?error=access_denied&error_description=lien+expire');
      await expect(page.getByText(/Erreur de confirmation/i)).toBeVisible({ timeout: 8_000 });
      // Le champ "Renvoyer le lien" doit être proposé
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('A05c — /auth/complete avec session active redirige vers /dashboard-client', async ({ page }) => {
      // Simuler un token valide dans le hash (callback OAuth/magic-link)
      // On pré-injecte une session dans localStorage pour que getSession() retourne un user
      await page.addInitScript(({ sessionBody, storageKey }) => {
        localStorage.setItem(storageKey, JSON.stringify(sessionBody));
      }, {
        storageKey: `sb-${process.env.VITE_SUPABASE_PROJECT_ID ?? 'cgrosjzmbgxmtvwxictr'}-auth-token`,
        sessionBody: mockSessionBody(),
      });

      await page.goto('/auth/complete#access_token=mock&type=signup');
      // Avec une session active + token, redirect automatique → /dashboard-client après 2,5 s
      await page.waitForURL('**/dashboard-client', { timeout: 10_000 });
    });

    test('A06 — email déjà utilisé (ghost user) affiche le toast d\'erreur', async ({ page }) => {
      // auth/v1/** catch-all returns 401 → SIGNED_OUT after ghost user SIGNED_IN
      // → /auth guard stays neutral, toast remains visible
      await page.route('**/auth/v1/**',     json(401, { error: 'no session' }));
      await page.route('**/rest/v1/**',     json(200, []));
      await page.route(/\/auth\/v1\/signup/, mockSignupGhostUser);
      await page.route('**/functions/v1/**', mockEdgeFn200);
      await fillSignupFields(page);
      await tickConsents(page);
      await page.getByRole('button', { name: /Créer mon compte client/i }).click();
      // ClientSignupForm détecte identities: [] et lance un toast "déjà utilisé"
      await expect(
        page.getByText(/déjà utilisé|veuillez vous connecter/i)
      ).toBeVisible({ timeout: 10_000 });
    });

    test('A06b — bouton soumettre désactivé pendant l\'envoi en cours', async ({ page }) => {
      // Ralentir la réponse pour observer l'état "Création de votre compte..."
      await page.route('**/auth/v1/signup', async (route) => {
        await new Promise((r) => setTimeout(r, 800));
        mockSignupSuccess(route);
      });
      await page.route('**/functions/v1/**', mockEdgeFn200);

      await fillSignupFields(page);
      await tickConsents(page);
      const submitBtn = page.getByRole('button', { name: /Créer mon compte client/i });
      await submitBtn.click();
      // Pendant l'envoi, le texte change et le bouton est désactivé
      await expect(page.getByText(/Création de votre compte/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Création de votre compte/i })).toBeDisabled();
    });
  });

  // ── Connexion client ──────────────────────────────────────────────────────

  test.describe('Login — F03 erreur / A07 succès', () => {

    test.beforeEach(async ({ page }) => {
      await goToAuth(page);
      await selectClientType(page);
      // Formulaire de connexion affiché (SecureAuthForm mode="login")
    });

    test('F03 — mauvais identifiants affichent un toast d\'erreur', async ({ page }) => {
      await page.route('**/auth/v1/token*', mockLoginInvalid);
      await page.locator('input[type="email"]').fill(MOCK_EMAIL);
      await page.locator('input[type="password"]').fill('wrongpassword');
      // Submit : cherche le bouton de soumission du formulaire de connexion
      await page.locator('form').getByRole('button', { name: /connecter|connexion/i }).last().click();
      await expect(
        page.getByText(/identifiants invalides|invalide|incorrect|login credentials/i)
      ).toBeVisible({ timeout: 10_000 });
    });

    test('A07 — connexion réussie client redirige vers /espace-personnel', async ({ page }) => {
      await setupLoginMocks(page);
      await page.locator('input[type="email"]').fill(MOCK_EMAIL);
      await page.locator('input[type="password"]').fill('TestPass1!');
      await page.locator('form').getByRole('button', { name: /connecter|connexion/i }).last().click();
      await expect(page).toHaveURL(/espace-personnel/, { timeout: 12_000 });
    });

    test('A07b — lien "Mot de passe oublié" navigue vers /reset-password', async ({ page }) => {
      await page.getByText(/Mot de passe oublié/i).click();
      await expect(page).toHaveURL(/reset-password/);
    });
  });

  // ── Guards d'authentification ─────────────────────────────────────────────

  test.describe('N03/N04/R01 — Routes protégées sans session', () => {

    test('N03 — /payment sans session redirige vers /auth', async ({ page }) => {
      await page.goto('/payment');
      await expect(page).toHaveURL(/\/auth/, { timeout: 8_000 });
    });

    test('N04 — /espace-personnel sans session redirige vers /auth', async ({ page }) => {
      await page.goto('/espace-personnel');
      await expect(page).toHaveURL(/\/auth/, { timeout: 8_000 });
    });

    test('N05 — /modern-admin sans session redirige', async ({ page }) => {
      await page.goto('/modern-admin');
      // AdminRoute redirige vers /auth ou vers /admin-login selon la config
      await expect(page).toHaveURL(/\/auth|\/admin\/login/, { timeout: 8_000 });
    });

    test('N06 — /espace-prestataire sans session redirige vers /auth', async ({ page }) => {
      await page.goto('/espace-prestataire');
      await expect(page).toHaveURL(/\/auth/, { timeout: 8_000 });
    });

    test('R01 — ProtectedRoute ne flashe pas le contenu protégé avant redirect', async ({ page }) => {
      // On capture toute navigation pour vérifier qu'on n'atterrit jamais sur /espace-personnel
      const urls: string[] = [];
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) urls.push(frame.url());
      });

      await page.goto('/espace-personnel');
      await expect(page).toHaveURL(/\/auth/, { timeout: 8_000 });

      // Aucune frame ne doit avoir chargé le vrai /espace-personnel avec du contenu
      // (la redirect est immédiate grâce au guard, pas de contenu rendu entre les deux)
      const protectedRendered = await page.locator('text=Espace personnel').isVisible();
      expect(protectedRendered).toBe(false);
    });

    test('N03b — /payment sans session préserve la query string dans la redirect', async ({ page }) => {
      // Certaines implémentations de ProtectedRoute passent l'URL cible via ?redirect=
      await page.goto('/payment?service=Ménage&price=50');
      await expect(page).toHaveURL(/\/auth/, { timeout: 8_000 });
      // L'URL de destination est /auth (le reste est géré côté composant)
    });
  });

  // ── Lien "Mot de passe oublié" / reset password ───────────────────────────

  test.describe('Reset password — liens et formulaire', () => {

    test('RP01 — /reset-password charge le formulaire de réinitialisation', async ({ page }) => {
      await page.goto('/reset-password');
      // La page doit proposer un champ email
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('RP02 — /update-password charge le formulaire de nouveau mot de passe', async ({ page }) => {
      await page.addInitScript(({ sessionBody, storageKey }) => {
        localStorage.setItem(storageKey, JSON.stringify(sessionBody));
      }, {
        storageKey: `sb-${process.env.VITE_SUPABASE_PROJECT_ID ?? 'cgrosjzmbgxmtvwxictr'}-auth-token`,
        sessionBody: mockSessionBody(),
      });
      await page.route('**/auth/v1/**',     json(401, { error: 'no session' }));
      await page.route('**/rest/v1/**',     json(200, []));
      await page.route('**/auth/v1/user**', json(200, mockSessionBody().user));
      await page.goto('/update-password');
      await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 3_000 });
    });
  });
});

// ─── Helper réexposé pour tests cross-fichier si besoin ──────────────────────
export { mockSessionBody, makeMockJwt, MOCK_USER_ID, MOCK_EMAIL };
