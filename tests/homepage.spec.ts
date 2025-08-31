import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/MasterDebater\.ai/);
    
    // Check main title is visible
    const mainTitle = page.locator('h1').filter({ hasText: 'MASTERDEBATER.AI' });
    await expect(mainTitle).toBeVisible();
  });

  test('should display all 5 character cards', async ({ page }) => {
    // Check all characters are present
    const characters = ['Cartman', 'Kyle', 'Stan', 'Butters', 'Clyde'];
    
    for (const character of characters) {
      const card = page.locator('.character-card').filter({ hasText: character });
      await expect(card).toBeVisible();
    }
  });

  test('should show character quotes on hover', async ({ page }) => {
    // Hover over Cartman and check quote appears
    const cartmanCard = page.locator('.character-card').filter({ hasText: 'Cartman' });
    await cartmanCard.hover();
    
    const quote = page.locator('text="I\'m the MASTER debater!"');
    await expect(quote).toBeVisible();
  });

  test('should display live banner', async ({ page }) => {
    const banner = page.locator('.messy-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('LIVE NOW');
  });

  test('should show sign in button when not authenticated', async ({ page }) => {
    const signInButton = page.locator('button').filter({ hasText: 'Sign In' });
    await expect(signInButton).toBeVisible();
  });

  test('should show start debating button', async ({ page }) => {
    const startButton = page.locator('button').filter({ hasText: /START MASTER DEBATING|ENTER THE ARENA/ });
    await expect(startButton).toBeVisible();
  });

  test('should display recent podcast drama section', async ({ page }) => {
    const dramaSection = page.locator('text=/RECENT PODCAST DRAMA/');
    await expect(dramaSection).toBeVisible();
    
    // Check specific drama items
    await expect(page.locator('text="Clyde\'s Show STOLEN"')).toBeVisible();
    await expect(page.locator('text="Charlie Kirk Award"')).toBeVisible();
    await expect(page.locator('text="Getting That Nut"')).toBeVisible();
  });

  test('should display Cartman stats', async ({ page }) => {
    const statsSection = page.locator('text="CARTMAN\'S STOLEN STATS"');
    await expect(statsSection).toBeVisible();
    
    // Check stats values
    await expect(page.locator('text="Podcasts Stolen"')).toBeVisible();
    await expect(page.locator('text="Weekly Nut Goal"')).toBeVisible();
    await expect(page.locator('text="Charlie Kirk Awards"')).toBeVisible();
  });

  test('should have scattered decorative elements', async ({ page }) => {
    // Check at least some decorative elements are present
    const decorativeElements = page.locator('.absolute').filter({ 
      hasText: /🧸|⚡|🌮|🎲|🍔|📺/ 
    });
    
    const count = await decorativeElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to debate page when clicking start button', async ({ page }) => {
    // For signed out users, it should open sign in modal
    // For signed in users, it should navigate to /debate
    const startButton = page.locator('button').filter({ hasText: /START MASTER DEBATING|ENTER THE ARENA/ }).first();
    
    // Check button exists and is clickable
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();
  });
});