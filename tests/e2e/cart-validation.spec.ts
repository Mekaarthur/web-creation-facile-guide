import { test, expect } from '@playwright/test';

test.describe('Cart Validation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto('/login');
    await page.fill('input[type="email"]', 'client@bikawo.com');
    await page.fill('input[type="password"]', 'client123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should create and validate cart successfully', async ({ page }) => {
    // Go to services
    await page.goto('/services');
    
    // Add service to cart
    await page.click('button:has-text("Réserver"):first');
    await page.fill('input[name="address"]', '123 Rue de Paris, Paris');
    await page.fill('input[name="date"]', '2025-12-01');
    await page.click('button:has-text("Ajouter au panier")');
    
    // Go to cart
    await page.goto('/cart');
    
    // Verify service in cart
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    
    // Validate cart
    await page.click('button:has-text("Valider le panier")');
    
    // Should redirect to payment
    await page.waitForURL('/payment');
    
    // Verify payment page loaded
    await expect(page.locator('h1:has-text("Paiement")')).toBeVisible();
  });

  test('should show abandoned cart notification', async ({ page }) => {
    // Add service to cart
    await page.goto('/services');
    await page.click('button:has-text("Réserver"):first');
    await page.fill('input[name="address"]', '123 Rue de Paris, Paris');
    await page.click('button:has-text("Ajouter au panier")');
    
    // Wait for abandoned cart detection (2+ hours in real scenario)
    // For test, we can mock the time or trigger manually
    await page.goto('/cart');
    
    // Should show reminder banner
    await expect(page.locator('text=Finalisez votre réservation')).toBeVisible({
      timeout: 5000
    });
  });

  test('should expire cart after 24 hours', async ({ page }) => {
    // Mock expired cart scenario
    await page.goto('/cart');
    
    // Simulate expired cart (would need backend mock)
    await page.evaluate(() => {
      localStorage.setItem('cart_expired', 'true');
    });
    
    await page.reload();
    
    // Should show expiration message
    await expect(page.locator('text=Votre panier a expiré')).toBeVisible();
  });
});
