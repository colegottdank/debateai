import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/DebateAI/);
  });

  test('should display today\'s debate topic', async ({ page }) => {
    // Check for "Today's Debate" label
    const todayLabel = page.locator('text="Today\'s Debate"');
    await expect(todayLabel).toBeVisible();
    
    // Check that a topic is displayed
    const topicHeading = page.locator('h2');
    await expect(topicHeading).toBeVisible();
  });

  test('should show debate opponent', async ({ page }) => {
    // Check for "Debating against:" text
    const opponentText = page.locator('text=/Debating against:/');
    await expect(opponentText).toBeVisible();
  });

  test('should have a text input area', async ({ page }) => {
    // Check for textarea
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('placeholder', /Enter your argument|Type your opening/i);
  });

  test('should have a start debate button', async ({ page }) => {
    // Check for the start button
    const startButton = page.locator('button').filter({ hasText: /Start Debate/i });
    await expect(startButton).toBeVisible();
  });

  test('should show navigation links', async ({ page }) => {
    // Check for Advanced Setup link
    const advancedLink = page.locator('a').filter({ hasText: 'Advanced Setup' });
    await expect(advancedLink).toBeVisible();
    
    // Check for Previous Debates link
    const historyLink = page.locator('a').filter({ hasText: 'Previous Debates' });
    await expect(historyLink).toBeVisible();
  });

  test('should navigate to debate setup page', async ({ page }) => {
    const advancedLink = page.locator('a').filter({ hasText: 'Advanced Setup' });
    await advancedLink.click();
    await expect(page).toHaveURL('/debate');
  });

  test('should navigate to history page', async ({ page }) => {
    const historyLink = page.locator('a').filter({ hasText: 'Previous Debates' });
    await historyLink.click();
    await expect(page).toHaveURL('/history');
  });
});