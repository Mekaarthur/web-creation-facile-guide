/**
 * Flux E — Bouton "Réserver maintenant" → dialog → panier
 *
 * SERVICE-01 : clic btn-reserver ouvre le dialog BikaServiceBooking
 * SERVICE-02 : formulaire rempli → "Créneau ajouté au panier !"
 * SERVICE-03 : "Procéder au paiement" → /panier + article visible + bouton checkout
 */

import { test, expect, type Page } from '@playwright/test';

const SERVICE_URL = '/services/kids/garde-enfants-babysitting';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function openBookingDialog(page: Page) {
  await page.goto(SERVICE_URL);
  await expect(page.getByTestId('btn-reserver').first()).toBeVisible({ timeout: 10000 });
  await page.getByTestId('btn-reserver').first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
}

async function fillBookingForm(page: Page) {
  const dialog = page.getByRole('dialog');

  // Sélectionner la première option de prestation (garde-enfants a des options)
  await dialog.locator('input[name="service-option"]').first().click();

  // Ouvrir le calendrier et choisir la première date disponible (lendemain)
  await dialog.getByRole('button', { name: /choisir une date/i }).click();
  // react-day-picker v8 : les jours activables sont des <button> non désactivés dans le grid
  await page.locator('table[role="grid"] button:not([disabled]):not([aria-disabled="true"])').first().click();

  // Heure de début : 10:00  (les selects Radix sont [role="combobox"])
  const comboboxes = dialog.locator('[role="combobox"]');
  await comboboxes.nth(0).click();
  await page.getByRole('option', { name: '10:00' }).click();

  // Heure de fin : 13:00  (durée 3h, minimum 2h requis)
  await comboboxes.nth(1).click();
  await page.getByRole('option', { name: '13:00' }).click();

  // Adresse d'intervention
  await dialog.locator('#address').fill('15 rue de la Paix, 75001 Paris');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('SERVICE — Bouton "Réserver maintenant"', () => {

  test('SERVICE-01 : clic sur [data-testid="btn-reserver"] ouvre le dialog', async ({ page }) => {
    await page.goto(SERVICE_URL);

    const btn = page.getByTestId('btn-reserver').first();
    await expect(btn).toBeVisible({ timeout: 10000 });

    await btn.click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Réserver - Garde d'enfants/)).toBeVisible();
  });

  test('SERVICE-02 : formulaire complet → écran de succès dans le dialog', async ({ page }) => {
    await openBookingDialog(page);
    await fillBookingForm(page);

    await page.getByRole('dialog').getByRole('button', { name: /ajouter au panier/i }).click();

    await expect(page.getByText(/créneau ajouté au panier/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /procéder au paiement/i })).toBeVisible();
  });

  test('SERVICE-03 : "Procéder au paiement" → /panier + article visible + bouton checkout', async ({ page }) => {
    await openBookingDialog(page);
    await fillBookingForm(page);

    await page.getByRole('dialog').getByRole('button', { name: /ajouter au panier/i }).click();
    await expect(page.getByText(/créneau ajouté au panier/i)).toBeVisible({ timeout: 5000 });

    // Ce bouton est dans le dialog (écran succès) → ferme le dialog et navigue vers /panier
    await page.getByRole('button', { name: /procéder au paiement/i }).click();

    await expect(page).toHaveURL(/\/panier/, { timeout: 5000 });

    // Le service ajouté doit apparaître dans le panier
    await expect(page.getByText(/Garde d'enfants/i)).toBeVisible();

    // Le bouton "Procéder au paiement" du panier doit être présent
    await expect(page.getByRole('button', { name: /procéder au paiement/i })).toBeVisible();
  });

  test('SERVICE-04 : formulaire incomplet → toast d\'erreur, pas d\'ajout', async ({ page }) => {
    await openBookingDialog(page);

    // Cliquer "Ajouter au panier" sans rien remplir
    await page.getByRole('dialog').getByRole('button', { name: /ajouter au panier/i }).click();

    // Toast d'erreur attendu (formulaire incomplet)
    await expect(page.getByText(/incomplet|remplir|requis/i)).toBeVisible({ timeout: 3000 });

    // Le dialog reste ouvert (pas d'écran de succès)
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/créneau ajouté/i)).not.toBeVisible();
  });

});
