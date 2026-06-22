/**
 * Chemins critiques non testés (C01 – C10)
 *
 * C01 / TC-ROLE-01       user_roles vide → primaryRole=null → loading se libère, pas de blocage
 * C02 / TC-PROV-01       provider non vérifié + requireVerified → redirect onboarding, zéro flash
 * C03 / TC-MANDAT-01     MandateSignature : validation vide + payload envoyé après dessin
 * C04 / TC-CART-01       bikawo-cart JSON corrompu → CartPage ne plante pas, affiche panier vide
 * C05 / TC-PAY-PARAM-01  /payment sans ?price → 0,00 € affiché, pas de crash
 * C06 / TC-AUTH-REFRESH-01 storage event (TOKEN_REFRESHED simulé) → user toujours connecté
 * C07 / TC-CHATBOT-01    message chatbot avec { et } → pas de crash, réponse affiché
 * C08 / TC-WEBHOOK-01    (couvert par TC-PAY-FAIL-03b — alreadyProcessed=true dès la 1ère visite)
 * C09 / TC-MANDAT-RESIL-01 aucune UI de résiliation dans l'espace prestataire
 * C10 / TC-DOC-GUEST-01  session expirée pendant upload → message d'erreur clair (RLS)
 */

import { test, expect } from '@playwright/test';
import {
  MOCK_USER_ID,
  MOCK_PROVIDER_ID,
  MOCK_PROVIDER_EMAIL,
  makeClientSession,
  makeProviderSession,
  injectSession,
  json,
  stubEmpty,
  mockUserRolesClient,
  mockUserRolesProvider,
  mockProviderVerifiedSingle,
  supabaseStorageKey,
  minimalPdfBuffer,
} from './helpers/supabase-mocks';

// Données provider à l'étape 2 (mandat) — documents soumis + approuvés, mandat non signé
const PROVIDER_STEP2 = {
  id: MOCK_PROVIDER_ID, user_id: MOCK_USER_ID, is_verified: false, status: 'pending',
  business_name: 'Test Provider', documents_submitted: true,
  mandat_facturation_accepte: false, formation_completed: false,
};

// Documents requis tous approuvés
const APPROVED_DOCS = [
  { document_type: 'identity_document' },
  { document_type: 'siret_document' },
  { document_type: 'rib_iban' },
  { document_type: 'certification' },
];

// ─── C01 / TC-ROLE-01 ──────────────────────────────────────────────────────────

test.describe('TC-ROLE-01 — user_roles vide après inscription', () => {
  test('roles=[] + primaryRole=null → loading se libère, ProtectedRoute ne bloque pas', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await injectSession(page, makeClientSession());

    // catch-alls first (LIFO), specific mocks last
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**', json(200, makeClientSession().user));
    // user_roles retourne tableau vide → primaryRole=null
    await page.route('**/rest/v1/user_roles*', json(200, []));
    await page.route('**/rest/v1/providers*', json(200, null));

    await page.goto('/espace-personnel');

    // finally block libère loading même avec roles vides — texte spécifique à ProtectedRoute
    await expect(page.getByText('Vérification des accès...')).not.toBeVisible({ timeout: 10000 });

    // Pas de redirect vers /auth — user est authentifié (même sans rôle)
    await expect(page).toHaveURL(/espace-personnel/);

    // ProtectedRoute falls through (primaryRole=null ne match aucune redirect condition)
    // → page rendue, pas d'écran blanc
    await expect(page.locator('body')).toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});

// ─── C02 / TC-PROV-01 ──────────────────────────────────────────────────────────

test.describe('TC-PROV-01 — Provider non vérifié sur route requireVerified', () => {
  test('is_verified=false → redirect /provider-onboarding, zéro flash du dashboard', async ({ page }) => {
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
    // providers maybeSingle → is_verified: false
    await page.route('**/rest/v1/providers*', json(200, {
      id: MOCK_PROVIDER_ID, user_id: MOCK_USER_ID, is_verified: false, status: 'pending',
      business_name: 'Test Provider',
    }));

    await page.goto('/espace-prestataire');

    await expect(page).toHaveURL(/\/provider-onboarding/, { timeout: 8000 });

    // Pendant checkingVerified=true, ProtectedProviderRoute affiche un spinner
    // → le dashboard (children) n'est JAMAIS rendu avant la redirect
    await expect(page.getByText(/tableau de bord prestataire|mes prestations/i)).not.toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});

// ─── C03 / TC-MANDAT-01 ────────────────────────────────────────────────────────

test.describe('TC-MANDAT-01 — MandateSignature : validation + payload', () => {
  test('soumission sans cocher la case → bouton disabled, pas de PATCH', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await injectSession(page, makeProviderSession());

    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**', json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire', first_name: 'Test', last_name: 'Provider' },
      aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/user_roles*', mockUserRolesProvider);
    await page.route('**/rest/v1/providers*', json(200, PROVIDER_STEP2));
    await page.route('**/rest/v1/provider_documents*', json(200, APPROVED_DOCS));

    await page.goto('/provider-onboarding');

    // Étape 2 : MandateSignature (checkbox uniquement, plus de pad de signature)
    await expect(page.getByText(/mandat de facturation/i).first()).toBeVisible({ timeout: 10000 });

    // La case n'est pas cochée → le bouton est disabled
    const acceptBtn = page.getByRole('button', { name: /accepter le mandat/i });
    await expect(acceptBtn).toBeDisabled();

    expect(pageErrors).toHaveLength(0);
  });

  test('checkbox + soumission → payload envoyé, "Mandat accepté" affiché', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await injectSession(page, makeProviderSession());

    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**', json(200, {
      id: MOCK_USER_ID, email: MOCK_PROVIDER_EMAIL, role: 'authenticated',
      user_metadata: { user_type: 'prestataire', first_name: 'Test', last_name: 'Provider' },
      aud: 'authenticated', app_metadata: {},
    }));
    await page.route('**/rest/v1/user_roles*', mockUserRolesProvider);
    await page.route('**/rest/v1/provider_documents*', json(200, APPROVED_DOCS));
    await page.route('**/rest/v1/communications*', json(201, [{}]));

    let mandatePayload: Record<string, unknown> | null = null;
    await page.route('**/rest/v1/providers*', async (route) => {
      if (route.request().method() === 'PATCH') {
        mandatePayload = JSON.parse(route.request().postData() || '{}') as Record<string, unknown>;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ ...PROVIDER_STEP2, mandat_facturation_accepte: true }]) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PROVIDER_STEP2) });
      }
    });

    await page.goto('/provider-onboarding');
    await expect(page.getByText(/mandat de facturation/i).first()).toBeVisible({ timeout: 10000 });

    // Cocher la case d'acceptation
    await page.locator('#accept-mandate').click();
    await expect(page.locator('#accept-mandate')).toBeChecked();

    // Soumettre
    await page.getByRole('button', { name: /accepter le mandat/i }).click();

    // Succès : composant affiche "Mandat accepté"
    await expect(page.getByText(/mandat accepté/i)).toBeVisible({ timeout: 8000 });

    // Vérifier le payload
    expect(mandatePayload).not.toBeNull();
    expect(mandatePayload!['mandat_facturation_accepte']).toBe(true);
    expect(mandatePayload!['mandat_signature_date']).toBeDefined();

    expect(pageErrors).toHaveLength(0);
  });
});

// ─── C04 / TC-CART-01 ──────────────────────────────────────────────────────────

test.describe('TC-CART-01 — bikawo-cart JSON corrompu', () => {
  test('localStorage corrompu → CartPage affiche panier vide sans crash', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // Injecter un JSON invalide avant chargement de la page
    await page.addInitScript(() => {
      localStorage.setItem('bikawo-cart', '{corrupted: this is not valid json!!!');
      localStorage.setItem('bikawo-cart-timestamp', String(Date.now()));
    });

    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));

    await page.goto('/panier');

    // useBikawoCart catch() → supprime le localStorage corrompu → cartItems = []
    await expect(page.getByText(/panier est vide/i)).toBeVisible({ timeout: 5000 });

    // Le localStorage corrompu doit avoir été nettoyé automatiquement
    const cartValue = await page.evaluate(() => localStorage.getItem('bikawo-cart'));
    expect(cartValue).toBeNull();

    expect(pageErrors).toHaveLength(0);
  });
});

// ─── C05 / TC-PAY-PARAM-01 ─────────────────────────────────────────────────────

test.describe('TC-PAY-PARAM-01 — /payment sans paramètre ?price', () => {
  test('price absent → parseFloat(null)=NaN→0, 0,00 € affiché, pas de crash', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await injectSession(page, makeClientSession());

    // catch-alls first (LIFO), specific mocks last
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**', json(200, makeClientSession().user));
    await page.route('**/rest/v1/user_roles*', mockUserRolesClient);
    await page.route('**/rest/v1/providers*', json(200, null));
    // Pas de moyen de paiement → affichage simple sans montant
    await page.route('**/functions/v1/get-payment-methods**', json(200, { paymentMethods: [] }));

    // Pas de paramètre ?price → Payment.tsx : parseFloat('0') = 0
    await page.goto('/payment?service=Test+Service');

    // Page /payment se charge (protégée : client connecté)
    await expect(page).toHaveURL(/\/payment/, { timeout: 8000 });

    // Le montant est affiché comme 0,00 € (.first() car le bouton "Payer 0,00 €" contient aussi ce texte)
    await expect(page.getByText('0,00 €').first()).toBeVisible({ timeout: 8000 });

    // Aucune erreur JS — pas de crash sur parseFloat(null)
    expect(pageErrors).toHaveLength(0);
  });
});

// ─── C06 / TC-AUTH-REFRESH-01 ──────────────────────────────────────────────────

test.describe('TC-AUTH-REFRESH-01 — TOKEN_REFRESHED simulé via storage event', () => {
  test('storage event avec nouveau token → user toujours connecté, pas de crash', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    const session = makeClientSession();
    await injectSession(page, session);

    // catch-alls first (LIFO), specific mocks last
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/auth/v1/user**', json(200, session.user));
    await page.route('**/rest/v1/user_roles*', mockUserRolesClient);
    await page.route('**/rest/v1/providers*', json(200, null));

    await page.goto('/espace-personnel');
    await expect(page).toHaveURL(/espace-personnel/, { timeout: 8000 });

    // Simuler un renouvellement de token (TOKEN_REFRESHED) via StorageEvent
    // Supabase écoute window.storage pour la synchronisation multi-onglets
    await page.evaluate((key) => {
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      const refreshed = {
        ...stored,
        access_token:  stored.access_token + '_refreshed',
        refresh_token: 'new_refresh_token_after_auto_renewal',
        expires_at:    Math.floor(Date.now() / 1000) + 3600,
      };
      const oldValue = JSON.stringify(stored);
      const newValue = JSON.stringify(refreshed);
      localStorage.setItem(key, newValue);
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        oldValue,
        newValue,
        storageArea: localStorage,
        url: location.href,
      }));
    }, supabaseStorageKey());

    // Après TOKEN_REFRESHED : user toujours connecté, pas de déconnexion inattendue
    // AVERTISSEMENT C06 : useAuth ne gère pas TOKEN_REFRESHED → fetchUserRoles NOT rappelé
    // Si un admin change le rôle de l'utilisateur, la UI ne reflète pas le changement
    // jusqu'à la prochaine déconnexion/reconnexion
    await page.waitForTimeout(500); // laisser Supabase traiter l'événement

    await expect(page).toHaveURL(/espace-personnel/);
    await expect(page.locator('body')).toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});

// ─── C07 / TC-CHATBOT-01 ───────────────────────────────────────────────────────

test.describe('TC-CHATBOT-01 — Chatbot avec caractères { et } dans le message', () => {
  test('message contenant { } → pas de crash, réponse ou erreur affichée', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // catch-alls first (LIFO), specific mocks last — intelligent-chatbot doit être enregistré APRÈS
    // le catch-all functions/v1/** pour avoir la priorité (Playwright uses unshift)
    await page.route('**/auth/v1/**', stubEmpty);
    await page.route('**/rest/v1/**', stubEmpty);
    await page.route('**/functions/v1/**', json(200, {}));
    await page.route('**/functions/v1/intelligent-chatbot**', json(200, {
      response: 'Bonjour ! Comment puis-je vous aider ?',
      conversationId: 'conv-test-001',
      needsHumanEscalation: false,
      shouldCollectContact: false,
      suggestedActions: [],
    }));

    await page.goto('/');

    // Ouvrir le chatbot — classe unique bg-gradient-primary sur le bouton flottant ChatBot
    await page.locator('button.w-14.h-14.rounded-full').click({ timeout: 10000 });

    // Attendre que l'interface de chat soit visible
    await expect(page.locator('input[placeholder*="question"]')).toBeVisible({ timeout: 5000 });

    // Taper un message avec { et } (potentiel injection template)
    const maliciousMsg = 'Bonjour ${alert(1)} — voici un test {inject: true}';
    await page.locator('input[placeholder*="question"]').fill(maliciousMsg);

    // Envoyer le message
    await page.locator('input[placeholder*="question"]').press('Enter');

    // La réponse du chatbot (ou le message d'erreur) doit être affichée
    await expect(
      page.getByText(/bonjour.*aider|difficultés techniques/i).first()
    ).toBeVisible({ timeout: 8000 });

    // Aucune erreur JS — pas d'évaluation de template ou d'injection
    expect(pageErrors).toHaveLength(0);
  });
});

// ─── C08 / TC-WEBHOOK-01 ───────────────────────────────────────────────────────
// Couvert par TC-PAY-FAIL-03b dans payment-failure.spec.ts :
//   → alreadyProcessed=true dès la 1ère visite (webhook a traité le paiement avant le retour navigateur)
//   → verify-payment retourne alreadyProcessed:true → "Réservation enregistrée" affiché

// ─── C09 / TC-MANDAT-RESIL-01 ──────────────────────────────────────────────────

test.describe('TC-MANDAT-RESIL-01 — Aucune UI de résiliation dans l\'espace prestataire', () => {
  test('espace prestataire vérifié → pas de bouton "Résilier" visible (feature manquante documentée)', async ({ page }) => {
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
    // Provider vérifié — accède à l'espace prestataire complet
    await page.route('**/rest/v1/providers*', mockProviderVerifiedSingle);

    await page.goto('/espace-prestataire');

    await expect(page).toHaveURL(/espace-prestataire/, { timeout: 8000 });

    // FONCTIONNALITÉ MANQUANTE (C09) : aucune UI de résiliation de mandat
    // Le prestataire ne peut pas résilier via l'application (seulement par courrier LRAR)
    await expect(page.getByRole('button', { name: /résil/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /résil/i })).not.toBeVisible();
    await expect(page.getByText(/résilier le mandat/i)).not.toBeVisible();

    expect(pageErrors).toHaveLength(0);
  });
});

// ─── C10 / TC-DOC-GUEST-01 ─────────────────────────────────────────────────────

test.describe('TC-DOC-GUEST-01 — Upload document avec session expirée (RLS storage)', () => {
  test('session expirée pendant upload → message d\'erreur clair, pas de crash', async ({ page }) => {
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
    // Provider à l'étape 1 (documents) — documents_submitted=false
    await page.route('**/rest/v1/providers*', json(200, {
      id: MOCK_PROVIDER_ID, user_id: MOCK_USER_ID, is_verified: false, status: 'pending',
      business_name: 'Test Provider', documents_submitted: false,
      mandat_facturation_accepte: false, formation_completed: false,
    }));
    await page.route('**/rest/v1/provider_documents*', json(200, []));

    await page.goto('/provider-onboarding');
    await expect(page.getByText(/documents requis/i)).toBeVisible({ timeout: 10000 });

    // Simuler une session expirée EN COURS D'UPLOAD :
    // supabase.auth.getUser() renvoie null → le composant lève "Non authentifié"
    // (override APRÈS chargement de la page — LIFO: cette route sera vérifiée en 1ère)
    await page.route('**/auth/v1/user**', json(401, { message: 'JWT expired', code: 'token_expired' }));

    // Tenter l'upload via le file chooser
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /^uploader$/i }).first().click(),
    ]);
    await fileChooser.setFiles({
      name: 'identity.pdf',
      mimeType: 'application/pdf',
      buffer: minimalPdfBuffer(),
    });

    // Message d'erreur clair — "Non authentifié" ou un message d'erreur de l'upload
    await expect(
      page.getByText(/non authentifié|erreur.*upload|session.*expir/i).first()
    ).toBeVisible({ timeout: 8000 });

    expect(pageErrors).toHaveLength(0);
  });
});
