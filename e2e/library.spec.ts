import { test, expect } from '@playwright/test';

test.describe('End-to-End Personal Library, Favorites Golden Rule and Reordering Flow', () => {
  const uniqueId = Date.now();
  const testUser = {
    displayName: `Library Tester ${uniqueId}`,
    email: `library_${uniqueId}@example.com`,
    password: 'Password123!'
  };

  test('should register, add manhuas to library, toggle favorites (RN-04), update progress (RN-03), and remove items', async ({ page }) => {
    // Automatically accept confirm dialogs
    page.on('dialog', dialog => dialog.accept());

    // 1. Register User
    await page.goto('/register');
    await page.fill('input[name="displayName"]', testUser.displayName);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/profile', { timeout: 10000 });
    await expect(page.locator('h2')).toContainText(testUser.displayName);

    // 2. Navigate to Catalog
    await page.click('a:has-text("Catálogo")');
    await page.waitForURL('**/catalog', { timeout: 10000 });

    // Open first manhua details
    await expect(page.locator('h3').first()).toBeVisible({ timeout: 10000 });
    await page.locator('a:has-text("Detalhes")').first().click();
    await page.waitForURL(/.*catalog\/.+/, { timeout: 10000 });

    // 3. Add first manhua to library
    const addBtn = page.locator('button:has-text("+ Adicionar à Biblioteca")');
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await expect(page.locator('button:has-text("Na Minha Biblioteca")')).toBeVisible();

    // 4. Navigate to Library
    await page.click('a:has-text("Biblioteca")');
    await page.waitForURL('**/library', { timeout: 10000 });

    // Verify Library Hero
    await expect(page.locator('h1')).toContainText('Minha Biblioteca');

    // Should be in regular list initially
    await expect(page.locator('[data-testid="regular-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="favorite-item"]')).toHaveCount(0);

    // 5. Toggle Favorite (Golden Rule RN-04.1 & RN-04.2)
    const starBtn = page.locator('[data-testid="regular-item"] button[title="Adicionar aos favoritos"]');
    await starBtn.click();

    // Now it should be in favorites list!
    await expect(page.locator('[data-testid="favorite-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="regular-item"]')).toHaveCount(0);

    // 6. Test Reading Progress Stepper (RN-03.3)
    const favoriteItem = page.locator('[data-testid="favorite-item"]').first();
    await expect(favoriteItem.locator('text=Cap. 1')).toBeVisible();

    // Increment chapter
    const plusBtn = favoriteItem.locator('button[title="Próximo Capítulo"]');
    await plusBtn.click();
    await expect(favoriteItem.locator('text=Cap. 2')).toBeVisible();

    // Capture visual screenshot of the populated library
    await page.screenshot({
      path: '/home/thiagofdso/.gemini/antigravity-cli/brain/08736a4c-a33e-4aed-8c04-34072a0f9117/library-view.png',
      fullPage: true
    });

    // Decrement chapter back
    const minusBtn = favoriteItem.locator('button[title="Capítulo Anterior"]');
    await minusBtn.click();
    await expect(favoriteItem.locator('text=Cap. 1')).toBeVisible();

    // 7. Remove item from library
    const deleteBtn = favoriteItem.locator('button[title="Remover da biblioteca"]');
    await deleteBtn.click();

    // Library should now be empty
    await expect(page.locator('text=Sua biblioteca está vazia')).toBeVisible();
  });
});
