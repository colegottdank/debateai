# Spike: SEO Landing Pages Architecture

## Context
We need to generate static, SEO-friendly landing pages for each debate topic to improve organic search visibility.
Current Stack: Next.js 15, Vercel, Cloudflare D1.

## Requirements
- **Performance:** Fast TTFB (Time To First Byte).
- **SEO:** Full metadata (Title, Description, OG Tags, JSON-LD schema).
- **Scale:** Support for potentially thousands of debate topics.
- **Freshness:** Updates to debates (new arguments) should be reflected reasonably fast.

## Proposed Architecture: Incremental Static Regeneration (ISR)

We recommend using **ISR** (via Next.js `revalidate` or `dynamic = 'error'` with `generateStaticParams`).

### Why not pure SSG?
- Too many topics to build at deploy time.
- Build times would scale linearly with content.

### Why not SSR?
- Higher TTFB (database query on every request).
- Higher database load (D1 reads).
- Vercel function execution costs.

### The ISR Strategy
1.  **Route:** `src/app/topic/[slug]/page.tsx`
2.  **Static Paths:** Use `generateStaticParams` to pre-render top ~100 popular topics at build time.
3.  **Fallback:** Allow other topics to be generated on-demand (first request is SSR-like, then cached).
4.  **Revalidation:** Set a revalidation period (e.g., `revalidate = 3600` for 1 hour) or use On-Demand Revalidation (via webhook/API) when a debate is updated.

## Implementation Details

### Page Component (`page.tsx`)
```typescript
import { Metadata } from 'next';
import { getTopicBySlug } from '@/lib/api/topics';

export const revalidate = 3600; // Revalidate every hour
// OR
// export const dynamic = 'force-static';

export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = params;
  const topic = await getTopicBySlug(slug);
  return {
    title: `${topic.title} | DebateAI`,
    description: topic.summary,
    openGraph: {
        images: [topic.ogImage],
    },
    alternates: {
        canonical: `https://debateai.org/topic/${slug}`,
    }
  };
}

export default async function TopicPage({ params }) {
  const { slug } = params;
  const topic = await getTopicBySlug(slug);
  
  return (
    <article>
      <h1>{topic.title}</h1>
      {/* Debate Content */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(makeSchema(topic)) }}
      />
    </article>
  );
}
```

### Database Optimization
- Ensure `getTopicBySlug` is efficient.
- Since D1 is remote, caching the result at the edge (Vercel Data Cache) is critical. ISR handles this naturally.

## Risks & Mitigations
- **D1 Latency:** If D1 is slow, the first request (miss) will be slow.
  - *Mitigation:* Pre-build top pages. Use loading skeletons if we switch to streaming (PPR - Partial Prerendering) in the future.
- **Vercel Limits:** ISR cache size limits.
  - *Mitigation:* High revalidate time for old/niche topics.

## Next Steps
1. Create `src/app/topic/[slug]/page.tsx`.
2. Implement `generateMetadata`.
3. Add JSON-LD Structured Data (Article or DiscussionForumPosting).
