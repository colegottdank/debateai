import { test, expect } from '@playwright/test';

test.describe('Share API', () => {
  test('should return 400 for missing debate ID', async ({ request }) => {
    // The route requires a debateId param — hitting the base path should 404
    const response = await request.get('/api/share/');
    // Next.js will return 404 for missing dynamic segment
    expect([400, 404]).toContain(response.status());
  });

  test('should return 404 for non-existent debate', async ({ request }) => {
    const response = await request.get('/api/share/non-existent-debate-id-12345');
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test('should be publicly accessible (no auth required)', async ({ request }) => {
    // Should not return 401/403 even without auth
    const response = await request.get('/api/share/test-id');
    expect(response.status()).not.toBe(401);
    expect(response.status()).not.toBe(403);
  });
});

test.describe('Embed API', () => {
  test('should return 404 for non-existent debate', async ({ request }) => {
    const response = await request.get('/api/embed/non-existent-debate-id-12345');
    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/html');
  });

  test('should be publicly accessible (no auth required)', async ({ request }) => {
    const response = await request.get('/api/embed/test-id');
    expect(response.status()).not.toBe(401);
    expect(response.status()).not.toBe(403);
  });

  test('should return HTML content type', async ({ request }) => {
    const response = await request.get('/api/embed/test-id');
    const contentType = response.headers()['content-type'];
    // Even error responses should be HTML
    expect(contentType).toContain('text/html');
  });

  test('should support theme parameter', async ({ request }) => {
    const darkResponse = await request.get('/api/embed/test-id?theme=dark');
    const lightResponse = await request.get('/api/embed/test-id?theme=light');
    // Both should return valid responses (404 HTML in this case)
    expect(darkResponse.status()).toBeLessThan(500);
    expect(lightResponse.status()).toBeLessThan(500);
  });
});

test.describe('OG Image API', () => {
  test('should return an image without debateId', async ({ request }) => {
    const response = await request.get('/api/og');
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('image/png');
  });

  test('should be publicly accessible', async ({ request }) => {
    const response = await request.get('/api/og');
    expect(response.status()).not.toBe(401);
    expect(response.status()).not.toBe(403);
  });

  test('should handle non-existent debateId gracefully', async ({ request }) => {
    const response = await request.get('/api/og?debateId=non-existent');
    // Should return default OG image, not error
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('image/png');
  });
});
