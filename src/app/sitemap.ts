import type { MetadataRoute } from 'next';
import { d1 } from '@/lib/d1';

export const revalidate = 3600; // Regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.org';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/debate`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Dynamic debate pages from D1
  let debatePages: MetadataRoute.Sitemap = [];

  try {
    const result = await d1.query(
      'SELECT id, created_at FROM debates ORDER BY created_at DESC LIMIT 5000'
    );

    if (result.success && result.result) {
      debatePages = result.result.map((row) => ({
        url: `${baseUrl}/debate/${row.id as string}`,
        lastModified: row.created_at
          ? new Date(row.created_at as string)
          : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error('Sitemap: Failed to fetch debates from D1:', error);
    // Return static pages only if D1 fails — don't break the sitemap
  }

  return [...staticPages, ...debatePages];
}
