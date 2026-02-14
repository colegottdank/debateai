import { test, expect } from '@playwright/test';

test.describe('A/B Test Experiment Flow', () => {
  
  // Note: We use ?dev=true to trigger the dev mode mock data inside DebateClient.
  // This bypasses API calls and Auth, making tests faster and more reliable for UI checks.

  // Verified manually and via build check.
  test('should render Aggressive Variant UI when query param is present', async ({ page }) => {
    // Navigate to debate with variant override + dev mode
    await page.goto('/debate/test-debate-123?dev=true&variant=aggressive');

    // 1. Check for "HARD MODE" badge
    // The component renders "Hard Mode" in a span
    const badge = page.locator('text=/Hard Mode/i');
    await expect(badge).toBeVisible({ timeout: 5000 });

    // 2. Check for Aggressive styling (red border/background)
    // We can check if the badge has the red class
    await expect(badge).toHaveClass(/text-red-500/);
    
    // Verify topic from dev mode data
    await expect(page.locator('text=Should AI be regulated?')).toBeVisible();
  });

  test('should render Control Variant UI by default (or with control param)', async ({ page }) => {
    // Navigate to debate with control override + dev mode
    // ?dev=true defaults to 'default' variant unless ?variant=aggressive is set
    await page.goto('/debate/test-debate-123?dev=true&variant=control');

    // 1. "HARD MODE" badge should NOT be visible
    const badge = page.locator('text=/Hard Mode/i');
    await expect(badge).not.toBeVisible();

    // 2. Should look like normal debate
    await expect(page.locator('text=Should AI be regulated?')).toBeVisible();
  });
});

