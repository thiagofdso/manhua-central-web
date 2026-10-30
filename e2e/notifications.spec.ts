import { test, expect } from '@playwright/test';

test.describe('End-to-End Scheduled Routine Check & Notification Bell Flow', () => {
  const timestamp = Date.now();
  const testEmail = `subscriber_${timestamp}@example.com`;
  const testPassword = 'Password123!';

  test('should trigger 23:50 routine check, display reactive notification badge, open dropdown and navigate to chapter', async ({ page }) => {
    // 1. Register a fresh user
    await page.goto('/register');
    await page.fill('input[type="text"]', 'Subscriber Reader');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to profile or catalog
    await page.waitForURL(/(profile|catalog)/, { timeout: 10000 });

    // 2. Navigate to Catalog and add a manhua to library
    await page.goto('/catalog');
    await expect(page.locator('h1')).toContainText('Catálogo Canônico Global');

    // Click on the first manhua details button
    await expect(page.locator('h3').first()).toBeVisible({ timeout: 10000 });
    await page.locator('a:has-text("Detalhes")').first().click();
    await page.waitForURL(/.*catalog\/.+/, { timeout: 10000 });

    // In detail page, click "+ Adicionar à Biblioteca"
    const addBtn = page.locator('button:has-text("+ Adicionar à Biblioteca")').first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    // Verify it changed to in-library state
    await expect(page.locator('button:has-text("Na Minha Biblioteca")')).toBeVisible({ timeout: 5000 });

    // 3. Trigger routine release check via API
    const routineRes = await page.request.post('http://localhost:8080/api/routine/run-check');
    expect(routineRes.ok()).toBeTruthy();
    const routineData = await routineRes.json();
    expect(routineData.lockAcquired).toBe(true);

    // 4. Reload page to trigger notification loading
    await page.reload();

    // 5. Check notification bell badge counter
    const bellBtn = page.locator('app-notification-bell button');
    await expect(bellBtn).toBeVisible({ timeout: 10000 });

    const badge = page.locator('app-notification-bell span.animate-pulse');
    await expect(badge).toBeVisible({ timeout: 10000 });
    const unreadCount = await badge.innerText();
    expect(Number(unreadCount)).toBeGreaterThan(0);

    // 6. Click bell button to open dropdown panel
    await bellBtn.click();

    const dropdown = page.locator('app-notification-bell .bg-surface');
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    await expect(dropdown.locator('h3')).toContainText('Notificações');

    // 7. Capture visual screenshot of the Notification Central overlay
    await page.screenshot({
      path: '/home/thiagofdso/.gemini/antigravity-cli/brain/08736a4c-a33e-4aed-8c04-34072a0f9117/notifications-view.png',
      fullPage: false
    });

    // 8. Click on the novel chapter notification item
    const notifItem = dropdown.locator('.divide-y > div').first();
    await expect(notifItem).toBeVisible();
    await notifItem.click();

    // 9. Verify navigation to the reader view for that novel chapter
    await page.waitForURL(/.*reader\/.+\/\d+/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*reader/);
  });
});
