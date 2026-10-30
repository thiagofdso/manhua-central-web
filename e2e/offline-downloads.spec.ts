import { test, expect } from '@playwright/test';

test.describe('End-to-End Batch Offline Downloads and Network-Disconnected Reading Flow', () => {
  test('should trigger batch download, persist in IndexedDB, and render offline without network (RN-05.3 & ADR-0011)', async ({ page }) => {
    // 1. Navigate to Overgeared catalog detail
    await page.goto('/catalog/overgeared');
    await expect(page.locator('h1')).toContainText('Overgeared');

    // 2. Open Downloads Dialog
    const downloadBtn = page.locator('button:has-text("Baixar Capítulos")');
    await expect(downloadBtn).toBeVisible();
    await downloadBtn.click();

    // Verify dialog opened
    await expect(page.locator('h3:has-text("Downloads Offline")')).toBeVisible({ timeout: 5000 });

    const dialog = page.locator('app-downloads-dialog');
    const inputs = dialog.locator('input[type="number"]');
    await inputs.nth(0).fill('1');
    await inputs.nth(1).fill('2');

    // Submit batch download
    const confirmDownloadBtn = dialog.locator('button:has-text("Baixar 2 Capítulo(s)")');
    await expect(confirmDownloadBtn).toBeVisible();
    await confirmDownloadBtn.click();

    // 4. Verify Downloads Drawer opens and shows tasks
    const drawer = page.locator('app-active-downloads-drawer aside');
    await expect(drawer).toBeVisible({ timeout: 5000 });
    await expect(drawer.locator('text=Fila de Downloads')).toBeVisible();

    // Wait for chapters 1 and 2 to complete (status: Salvo)
    await expect(drawer.locator('text=Salvo').first()).toBeVisible({ timeout: 20000 });

    // Capture screenshot of the Downloads Drawer
    await page.screenshot({
      path: '/home/thiagofdso/.gemini/antigravity-cli/brain/08736a4c-a33e-4aed-8c04-34072a0f9117/downloads-drawer.png',
      fullPage: false
    });

    // 5. Simulate Complete Network Failure for reader endpoints (Offline Mode)
    // Abort any attempt to fetch chapter images from the network
    await page.route('**/api/reader/chapter-images*', route => route.abort('failed'));
    await page.route('**/api/reader/proxy-image*', route => route.abort('failed'));

    // 6. Navigate to Chapter 1 via client-side link in the chapters grid
    const cap1Link = page.locator('a:has-text("Cap. 1")').first();
    await expect(cap1Link).toBeVisible();
    await cap1Link.click();

    await page.waitForURL(/.*reader\/overgeared\/1/, { timeout: 10000 });

    // Verify Offline Badge is rendered in reader header
    await expect(page.locator('text=Offline (IndexedDB)')).toBeVisible({ timeout: 10000 });

    // Verify image panels are displayed from IndexedDB blobs despite network abortion
    const panels = page.locator('img[data-testid="reader-panel"]');
    await expect(panels.first()).toBeVisible({ timeout: 10000 });
    const count = await panels.count();
    expect(count).toBeGreaterThan(0);

    // Capture screenshot of the Offline Reader rendered from IndexedDB
    await page.screenshot({
      path: '/home/thiagofdso/.gemini/antigravity-cli/brain/08736a4c-a33e-4aed-8c04-34072a0f9117/offline-reader-view.png',
      fullPage: false
    });

    // Unroute network aborts
    await page.unroute('**/api/reader/chapter-images*');
    await page.unroute('**/api/reader/proxy-image*');
  });
});
