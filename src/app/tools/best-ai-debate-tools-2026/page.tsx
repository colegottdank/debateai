import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/pages';
import { articleJsonLd } from '@/lib/jsonld';
import SeoPageLayout from '@/components/SeoPageLayout';
import AnalyticsPageView from '@/components/AnalyticsPageView';

const CATEGORY = 'tools';
const SLUG = 'best-ai-debate-tools-2026';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.debateai.org';

export const metadata: Metadata = {
  title: '7 Best AI Debate Tools in 2026 (Tested and Compared)',
  description:
    'We tested every major AI debate tool so you don\'t have to. Here are the 7 best in 2026 — from multi-model debate platforms to argument generators — with honest pros and cons.',
  keywords: ['best AI debate tools', 'AI debate tools 2026', 'AI debate platform', 'debate practice AI', 'AI argumentation tools'],
  alternates: {
    canonical: `${BASE_URL}/tools/best-ai-debate-tools-2026`,
  },
  openGraph: {
    title: '7 Best AI Debate Tools in 2026 (Tested and Compared)',
    description:
      'We tested every major AI debate tool so you don\'t have to. Here are the 7 best in 2026.',
    url: `${BASE_URL}/tools/best-ai-debate-tools-2026`,
    type: 'article',
    images: [{ url: `${BASE_URL}/api/og`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '7 Best AI Debate Tools in 2026 (Tested and Compared)',
    description:
      'We tested every major AI debate tool so you don\'t have to. Here are the 7 best in 2026.',
    images: [`${BASE_URL}/api/og`],
  },
};

export default function BestAIDebateToolsPage() {
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
