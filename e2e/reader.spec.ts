import { test, expect } from '@playwright/test';

test.describe('End-to-End Webtoon Continuous Reader and Streaming Proxy Flow', () => {
  test('should open chapter, render streamed images, navigate chapters, and enforce lastChapter ceiling', async ({ page }) => {
    // 1. Navigate to Chapter 1 of Overgeared
    await page.goto('/reader/overgeared/1');
    await expect(page).toHaveURL(/.*reader\/overgeared\/1/);

    // Verify header and document title
    await expect(page.locator('h1')).toContainText('Overgeared');
    await expect(page).toHaveTitle(/Overgeared - Cap\. 1/);

    // Wait for reader panels to load
    const panels = page.locator('img[data-testid="reader-panel"]');
    await expect(panels.first()).toBeVisible({ timeout: 10000 });
    const count = await panels.count();
    expect(count).toBeGreaterThan(0);

    // Verify image src uses the zero-buffer proxy endpoint
    const firstImgSrc = await panels.first().getAttribute('src');
    expect(firstImgSrc).toContain('/api/reader/proxy-image?url=');

    // Capture visual screenshot of the webtoon reader
    await page.screenshot({
      path: '/home/thiagofdso/.gemini/antigravity-cli/brain/08736a4c-a33e-4aed-8c04-34072a0f9117/reader-view.png',
      fullPage: false
    });

    // 2. Navigate to Chapter 2
    const nextBtn = page.locator('button[title="Próximo Capítulo (Seta Direita)"]');
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    await page.waitForURL(/.*reader\/overgeared\/2/, { timeout: 10000 });
    await expect(page).toHaveTitle(/Overgeared - Cap\. 2/);
    await expect(page.locator('text=Capítulo 2').first()).toBeVisible();

    // 3. Navigate back to Chapter 1
    const prevBtn = page.locator('button[title="Capítulo Anterior (Seta Esquerda)"]');
    await expect(prevBtn).toBeEnabled();
    await prevBtn.click();

    await page.waitForURL(/.*reader\/overgeared\/1/, { timeout: 10000 });
    await expect(page).toHaveTitle(/Overgeared - Cap\. 1/);

    // Previous button should now be disabled on chapter 1
    await expect(prevBtn).toBeDisabled();

    // 4. Test Ceiling at lastChapter (RN-03.2)
    // Check current lastChapter from catalog to handle dynamic updates
    const catalogRes = await page.request.get('http://localhost:8080/api/catalog/overgeared');
    let lastCh = 344;
    if (catalogRes.ok()) {
      const data = await catalogRes.json();
      if (data.lastChapter) lastCh = data.lastChapter;
    }
    await page.goto(`/reader/overgeared/${lastCh}`);
    await page.waitForURL(new RegExp(`.*reader/overgeared/${lastCh}`), { timeout: 10000 });

    // Verify Next button is disabled
    const nextBtnAtLast = page.locator('button[title="Próximo Capítulo (Seta Direita)"]');
    await expect(nextBtnAtLast).toBeDisabled();

    // Verify ceiling banner text
    await expect(page.locator('text=Você chegou ao último capítulo lançado desta obra!')).toBeVisible();
  });
});
