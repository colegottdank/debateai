# SEO Landing Pages Strategy for DebateAI

## Overview
Turn debate detail pages (`/debate/[id]`) into highly performant, SEO-optimized static landing pages.
Current implementation likely uses dynamic rendering (`force-dynamic`).
We want to leverage ISR (Incremental Static Regeneration) for performance and SEO.

## Goals
1.  Fast TTFB (< 200ms) for debate pages.
2.  Proper meta tags (Open Graph, Twitter Card) for social sharing.
3.  Ensure search engines index debate content effectively.
4.  Minimize D1 database load by caching static responses.

## Technical Architecture

### 1. Rendering Strategy: ISR (Incremental Static Regeneration)
-   **Active Debates:** Revalidate frequently (e.g., `revalidate: 60`).
    -   Ensures users see near-realtime updates without hammering the DB.
    -   Allows bots to index active discussions.
-   **Completed Debates:** Revalidate infrequently or effectively static (`revalidate: false` or high value like `86400`).
    -   Once a debate is `status: completed`, content is immutable.
    -   Should be cached at edge indefinitely.

### 2. Implementation Plan (Next.js App Router)

#### Page Configuration (`app/debate/[id]/page.tsx`)
```typescript
// Active debates: revalidate every minute
// Completed debates: could use on-demand revalidation or longer cache
export const revalidate = 60; 

export async function generateStaticParams() {
  // Prerender popular/recent debates at build time
  const recentDebates = await getRecentDebates();
  return recentDebates.map((debate) => ({ id: debate.id }));
}
```

#### Metadata (`generateMetadata`)
Crucial for SEO. Dynamically generate title/description based on debate content.
```typescript
export async function generateMetadata({ params }) {
  const debate = await getDebate(params.id);
  return {
    title: `${debate.title} | DebateAI`,
    description: `Watch AI models argue: ${debate.topic}`,
    openGraph: {
      images: [`/api/og?title=${encodeURIComponent(debate.title)}`],
    },
  };
}
```

### 3. Caching Strategy (Vercel + Cloudflare)
-   **Edge Cache:** Vercel automatically caches ISR pages at the edge.
-   **Database Load:** Drastically reduced. Instead of 1 query per visitor, it's 1 query per minute (per debate).
-   **On-Demand Revalidation:** Optional. Trigger revalidation via API when a new message is added to a debate.
    -   Hook into the backend message creation logic.
    -   `revalidatePath('/debate/[id]')`.

### 4. Sitemap & Robots.txt
-   Implement `app/sitemap.ts` to generate a dynamic sitemap of all public debates.
-   Ensure `robots.txt` allows crawling of `/debate/*`.

## Risks & Considerations
-   **Stale Content:** Users might see a slightly outdated debate state (up to 60s old). Acceptable for "landing page" view. Real-time updates via WebSocket/polling can hydration on client-side if needed.
-   **Build Time:** Prerendering thousands of debates could slow down builds. Solution: Only prerender top 100, let others generate on-demand (ISR).
