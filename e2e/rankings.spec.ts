import { test, expect } from '@playwright/test';

test.describe('End-to-End Community Rankings and 5-Star Bayesian Rating Flow', () => {
  const timestamp = Date.now();
  const testEmail = `rater_${timestamp}@example.com`;
  const testPassword = 'Password123!';

  test('should display rankings, switch tabs, submit 5-star rating, and verify score update', async ({ page }) => {
    // 1. First register a fresh user so we can test authenticated ratings
    await page.goto('/register');
    await page.fill('input[type="text"]', 'Ranking Critic');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to profile or catalog
    await page.waitForURL(/(profile|catalog)/, { timeout: 10000 });

    // 2. Navigate to Rankings page
    await page.goto('/rankings');
    await expect(page).toHaveURL(/.*rankings/);

    // Verify header and hero section
    await expect(page.locator('h1')).toContainText('Rankings & Destaques');
    await expect(page.locator('text=Comunidade Ativa')).toBeVisible();

    // Verify tabs are visible
    const topRatedTab = page.locator('button:has-text("Melhor Votados")');
    const dailyTab = page.locator('button:has-text("Mais Lidos Hoje")');
    const weeklyTab = page.locator('button:has-text("Mais Lidos na Semana")');
    const allTimeTab = page.locator('button:has-text("Top Geral")');

    await expect(topRatedTab).toBeVisible();
    await expect(dailyTab).toBeVisible();
    await expect(weeklyTab).toBeVisible();
    await expect(allTimeTab).toBeVisible();

    // Wait for leaderboard cards to appear
    const cards = page.locator('main .space-y-4 > div');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // 3. Tab switching test
    await dailyTab.click();
    await expect(dailyTab).toHaveClass(/bg-brand-600/);

    await weeklyTab.click();
    await expect(weeklyTab).toHaveClass(/bg-brand-600/);

    await allTimeTab.click();
    await expect(allTimeTab).toHaveClass(/bg-brand-600/);

    await topRatedTab.click();
    await expect(topRatedTab).toHaveClass(/bg-brand-600/);

    // 4. Capture screenshot of the Rankings Leaderboard
    await page.screenshot({
      path: '/home/thiagofdso/.gemini/antigravity-cli/brain/08736a4c-a33e-4aed-8c04-34072a0f9117/rankings-view.png',
      fullPage: false
    });

    // 5. Test Interactive 5-Star Rating directly on the card
    const firstCard = cards.first();
    const star5Btn = firstCard.locator('button[data-star="5"]');
    await expect(star5Btn).toBeVisible();
    await star5Btn.click();

    // Verify user rating indicator appears
    await expect(firstCard.locator('text=Seu voto: ★5')).toBeVisible({ timeout: 5000 });

    // 6. Test Detail page rating reflection
    await page.goto('/catalog/overgeared');
    await expect(page.locator('h1')).toContainText('Overgeared');

    const detailStarRating = page.locator('app-star-rating').first();
    await expect(detailStarRating).toBeVisible();

    // Rate with 5 stars on the detail page
    const detailStar5 = detailStarRating.locator('button[data-star="5"]');
    await detailStar5.click();
    await expect(page.locator('text=Voto computado: 5 ★')).toBeVisible({ timeout: 5000 });
  });
});
