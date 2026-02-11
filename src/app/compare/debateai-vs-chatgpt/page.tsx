import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/pages';
import { articleJsonLd } from '@/lib/jsonld';
import SeoPageLayout from '@/components/SeoPageLayout';
import AnalyticsPageView from '@/components/AnalyticsPageView';

const CATEGORY = 'compare';
const SLUG = 'debateai-vs-chatgpt';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.org';

export const metadata: Metadata = {
  title: 'DebateAI vs ChatGPT for Debate Practice: Purpose-Built Tool vs General AI',
  description:
    'ChatGPT can argue, but it wasn\'t built for debate. Compare DebateAI vs ChatGPT for structured debate practice — format, feedback, and how each handles real argumentation.',
  keywords: ['DebateAI vs ChatGPT', 'AI debate practice', 'ChatGPT debate', 'best AI for debate', 'debate practice tool'],
  alternates: {
    canonical: `${BASE_URL}/compare/debateai-vs-chatgpt`,
  },
  openGraph: {
    title: 'DebateAI vs ChatGPT for Debate Practice',
    description:
      'ChatGPT can argue, but it wasn\'t built for debate. Compare DebateAI vs ChatGPT for structured debate practice.',
    url: `${BASE_URL}/compare/debateai-vs-chatgpt`,
    type: 'article',
    images: [{ url: `${BASE_URL}/api/og`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DebateAI vs ChatGPT for Debate Practice',
    description:
      'ChatGPT can argue, but it wasn\'t built for debate. Compare DebateAI vs ChatGPT for structured debate practice.',
    images: [`${BASE_URL}/api/og`],
  },
};

export default function DebateAIvsChatGPTPage() {
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
