/**
 * F01-F04 - Validation formulaires d'authentification (client)
 *
 * F01 login  champs vides      -> "L'adresse email est obligatoire" + "Mot de passe requis"
 * F02 login  email invalide    -> "Format d'email invalide"
 * F03 signup password faible   -> "lettre majuscule" (clientSignupSchema)
 * F04 signup donnees valides   -> mock Supabase -> toast confirmation email
 *
 * Flux: /auth -> "Je suis Client" -> [login | S'inscrire -> signup]
 * ClientSignupForm est rendu pour client (pas SecureAuthForm).
 * Aucune session requise — storageState guest.json pour localStorage vide.
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { json, stubEmpty } from './helpers/supabase-mocks';

// Pas de session pour tous les tests
test.use({ storageState: 'tests/auth-states/guest.json' });

async function wireRoutes(page: Page): Promise<void> {
  await page.route('**/auth/v1/**',      stubEmpty);
  await page.route('**/rest/v1/**',      stubEmpty);
  await page.route('**/functions/v1/**', json(200, {}));
}

async function goToLoginStep(page: Page): Promise<void> {
  await page.goto('/auth');
  // Etape 1 : selectionner le type "Client"
  await page.getByRole('button', { name: /je suis client/i }).click();
  // Etape 2 : formulaire connexion rendu
  await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible({ timeout: 6000 });
}

async function goToSignupStep(page: Page): Promise<void> {
  await goToLoginStep(page);
  // Bouton "S'inscrire" dans la zone bascule login/signup
  await page.getByRole('button', { name: /inscrire/i }).click();
  // ClientSignupForm (userType=client) -> bouton "Creer mon compte client"
  await expect(page.getByRole('button', { name: /mon compte client/i })).toBeVisible({ timeout: 6000 });
}

// ---- F01 : Login champs vides -----------------------------------------------

test.describe('F01 - Login champs vides', () => {
  test('soumission vide -> "adresse email obligatoire" + "Mot de passe requis"', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await wireRoutes(page);
    await goToLoginStep(page);

    // Soumettre sans rien remplir — validation Zod cote client
    await page.getByRole('button', { name: /se connecter/i }).click();

    await expect(page.getByText(/adresse email est obligatoire/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/mot de passe requis/i).first()).toBeVisible({ timeout: 5000 });

    expect(pageErrors).toHaveLength(0);
  });
});

// ---- F02 : Login email invalide ---------------------------------------------

test.describe('F02 - Login email invalide', () => {
  test('email sans @ -> "Format d\'email invalide"', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await wireRoutes(page);
    await goToLoginStep(page);

    // Remplir avec un email sans domaine
    await page.getByPlaceholder('email@exemple.com').fill('notanemail');
    await page.getByPlaceholder(/••+/).fill('somepassword');
    await page.getByRole('button', { name: /se connecter/i }).click();

    // emailBase.email() -> "Format d'email invalide (exemple: nom@domaine.fr)"
    await expect(page.getByText(/format d.email invalide/i).first()).toBeVisible({ timeout: 5000 });

    expect(pageErrors).toHaveLength(0);
  });
});

// ---- F03 : Signup mot de passe sans majuscule -------------------------------

test.describe('F03 - Signup password sans majuscule', () => {
  test('password sans lettre majuscule -> erreur schema', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await wireRoutes(page);
    await goToSignupStep(page);

    // Remplir les champs avec un mot de passe sans majuscule
    await page.getByPlaceholder('Jean').fill('Marie');
    await page.getByPlaceholder('Dupont').fill('Durand');
    await page.getByPlaceholder('email@exemple.com').fill('marie@test.fr');
    // Mot de passe valide SAUF: pas de majuscule
    await page.locator('input[type="password"]').first().fill('nosecret1!');
    // Checkbox conditions -> shadcn Checkbox (role=checkbox)
    await page.getByRole('checkbox', { name: /accepte les conditions/i }).click();

    await page.getByRole('button', { name: /mon compte client/i }).click();

    // clientSignupSchema.regex(/[A-Z]/) -> "Le mot de passe doit contenir au moins une lettre majuscule"
    await expect(page.getByText(/lettre majuscule/i).first()).toBeVisible({ timeout: 5000 });

    expect(pageErrors).toHaveLength(0);
  });
});

// ---- F04 : Signup valide -> toast confirmation email -----------------------

test.describe('F04 - Signup valide -> toast email de confirmation', () => {
  test('donnees valides + mock signup -> "email de confirmation envoye"', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await wireRoutes(page);

    // Mocks specifiques APRES catch-alls (LIFO: verifes en premier)
    // check-email-exists -> disponible
    await page.route('**/functions/v1/check-email-exists**', json(200, { exists: false }));
    // send-confirmation-email -> success
    await page.route('**/functions/v1/send-confirmation-email**', json(200, { success: true }));
    // signup Supabase -> utilisateur cree, email non confirme (flux normal)
    await page.route('**/auth/v1/signup**', json(200, {
      access_token: 'mock_token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock_refresh',
      user: {
        id: 'new-uuid-f04',
        email: 'marie.new@test.fr',
        email_confirmed_at: null,
        aud: 'authenticated',
        role: 'authenticated',
        user_metadata: { user_type: 'client' },
        app_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }));

    await goToSignupStep(page);

    await page.getByPlaceholder('Jean').fill('Marie');
    await page.getByPlaceholder('Dupont').fill('Dupont');
    await page.getByPlaceholder('email@exemple.com').fill('marie.new@test.fr');
    // Mot de passe valide : majuscule + minuscule + chiffre + special
    await page.locator('input[type="password"]').first().fill('Secure@Pass1');
    await page.getByRole('checkbox', { name: /18 ans/i }).click();
    await page.getByRole('checkbox', { name: /accepte les conditions/i }).click();

    await page.getByRole('button', { name: /mon compte client/i }).click();

    // navigate('/auth/complete') appele juste apres toast() -> verifier l'URL plutot que le toast
    await expect(page).toHaveURL(/auth\/complete/, { timeout: 8000 });

    expect(pageErrors).toHaveLength(0);
  });
});
