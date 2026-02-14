import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/pages';
import { articleJsonLd } from '@/lib/jsonld';
import SeoPageLayout from '@/components/SeoPageLayout';
import AnalyticsPageView from '@/components/AnalyticsPageView';

const CATEGORY = 'guides';
const SLUG = 'how-to-practice-debate-online';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.debateai.org';

export const metadata: Metadata = {
  title: 'How to Practice Debate Online: The Complete 2026 Guide',
  description:
    'No partner, no coach, no problem. Here\'s how to practice debate online using AI tools, communities, and structured methods — from casual arguing to tournament prep.',
  keywords: ['how to practice debate online', 'online debate practice', 'debate practice without partner', 'AI debate practice', 'learn to debate online'],
  alternates: {
    canonical: `${BASE_URL}/guides/how-to-practice-debate-online`,
  },
  openGraph: {
    title: 'How to Practice Debate Online: The Complete 2026 Guide',
    description:
      'No partner, no coach, no problem. Here\'s how to practice debate online using AI tools, communities, and structured methods.',
    url: `${BASE_URL}/guides/how-to-practice-debate-online`,
    type: 'article',
    images: [{ url: `${BASE_URL}/api/og`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Practice Debate Online: The Complete 2026 Guide',
    description:
      'No partner, no coach, no problem. Here\'s how to practice debate online using AI tools, communities, and structured methods.',
    images: [`${BASE_URL}/api/og`],
  },
};

export default function HowToPracticeDebatePage() {
  const page = getPage(CATEGORY, SLUG);

  if (!page) {
    notFound();
  }

  return (
    <>
      <AnalyticsPageView
        type="page"
        path={`/${CATEGORY}/${SLUG}`}
        title={page.title}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleJsonLd({
              slug: SLUG,
              title: page.title,
              description: page.description,
              date: page.date,
              author: page.author,
              tags: page.keywords,
              basePath: `/${CATEGORY}`,
            })
          ),
        }}
      />
      <SeoPageLayout
        page={page}
        backLink={{ href: '/blog', label: 'Resources' }}
      />
    </>
  );
}
