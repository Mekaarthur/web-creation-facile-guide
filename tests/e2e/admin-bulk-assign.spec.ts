import { test, expect } from '@playwright/test';

test.describe('Admin Bulk Assign Missions', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@bikawo.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should bulk assign missions successfully', async ({ page }) => {
    await page.goto('/admin/missions');
    
    // Select multiple missions
    await page.click('input[type="checkbox"]:nth-of-type(1)');
    await page.click('input[type="checkbox"]:nth-of-type(2)');
    await page.click('input[type="checkbox"]:nth-of-type(3)');
    
    // Click bulk assign button
    await page.click('button:has-text("Assigner en masse")');
    
    // Wait for success message
    await expect(page.locator('text=Missions assignées avec succès')).toBeVisible({
      timeout: 10000
    });
    
    // Verify missions status changed
    const assignedMissions = page.locator('[data-status="assigned"]');
    await expect(assignedMissions).toHaveCount(3);
  });

  test('should show error when no missions selected', async ({ page }) => {
    await page.goto('/admin/missions');
    
    // Click bulk assign without selecting missions
    await page.click('button:has-text("Assigner en masse")');
    
    // Should show error
    await expect(page.locator('text=Veuillez sélectionner au moins une mission')).toBeVisible();
  });

  test('should apply rate limiting', async ({ page }) => {
    await page.goto('/admin/missions');
    
    // Select missions
    await page.click('input[type="checkbox"]:nth-of-type(1)');
    
    // Try to assign rapidly (should trigger rate limit after X attempts)
    for (let i = 0; i < 25; i++) {
      await page.click('button:has-text("Assigner")');
      await page.waitForTimeout(100);
    }
    
    // Should show rate limit error
    await expect(page.locator('text=Trop de requêtes')).toBeVisible({
      timeout: 5000
    });
  });
});
