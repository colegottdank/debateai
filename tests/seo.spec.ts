import { test, expect } from '@playwright/test';

test.describe('SEO: robots.txt', () => {
  test('should serve robots.txt with sitemap reference', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Allow: /');
    expect(body).toContain('Disallow: /api/');
    expect(body).toContain('Sitemap:');
    expect(body).toContain('sitemap.xml');
  });
});

test.describe('SEO: sitemap.xml', () => {
  test('should serve a valid sitemap', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    // Must be valid XML with sitemap namespace
    expect(body).toContain('<?xml');
    expect(body).toContain('<urlset');
    expect(body).toContain('sitemaps.org');
    // Must include static pages
    expect(body).toContain('<loc>');
  });

  test('should include the homepage', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    const body = await response.text();
    expect(body).toMatch(/debateai\.org\/?<\/loc>/);
  });

  test('should include the debate setup page', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    const body = await response.text();
    expect(body).toContain('/debate</loc>');
  });
});

test.describe('SEO: Debate page metadata', () => {
  test('should have OG tags on homepage', async ({ page }) => {
    await page.goto('/');
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBeTruthy();
    expect(ogTitle).toContain('DebateAI');

    const ogDesc = await page.getAttribute('meta[property="og:description"]', 'content');
    expect(ogDesc).toBeTruthy();

    const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
    expect(ogImage).toBeTruthy();
    expect(ogImage).toContain('/api/og');
  });

  test('should have Twitter card tags on homepage', async ({ page }) => {
    await page.goto('/');
    const twitterCard = await page.getAttribute('meta[name="twitter:card"]', 'content');
    expect(twitterCard).toBe('summary_large_image');
  });

  test('should have canonical URL on homepage', async ({ page }) => {
    await page.goto('/');
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBeTruthy();
  });
});

test.describe('SEO: JSON-LD structured data', () => {
  test('should have WebSite JSON-LD on homepage', async ({ page }) => {
    await page.goto('/');
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(jsonLd).toBeTruthy();
    const data = JSON.parse(jsonLd!);
    expect(data['@type']).toBe('WebSite');
    expect(data.name).toBe('DebateAI');
    expect(data.url).toBeTruthy();
  });
});
